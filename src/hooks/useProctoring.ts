import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProctoringState, UseProctoringOptions, ResultadoIncidente, TipoEvidencia, AnalisisProctoring } from '../types';
import api from '../api/axios';

// Política del backend: 1ª llamada = advertencia, 2ª = cancelación.
// Las llamadas de atención se cuentan del lado del servidor.
const LIMITE_LLAMADAS = 2;
// Umbrales del servicio Python de análisis (proctoring-service/)
const UMBRAL_MOVIMIENTO = 0.35;
const INTERVALO_CAPTURA_MS = 2000;
const CALIBRACION_SEGUNDOS = 5;
// El servicio de análisis requiere un rostro durante N checks consecutivos
// antes de reportar (evita falsos positivos por parpadeos/movimientos puntuales)
const CHECK_SOSTENIDO_SIN_ROSTRO = 3;
const CHECK_SOSTENIDO_OJOS = 3;
const CHECK_SOSTENIDO_BOCA = 2;
const CHECK_SOSTENIDO_VOLTEO = 2;
// Si el servicio no responde este número de veces seguidas, se muestra un aviso
const FALLOS_SERVICIO_AVISO = 3;
// ponytail: 0.08 RMS = conversación normal a 30cm
const UMBRAL_RUIDO = 0.08;
// Ventana móvil de audio que se adjunta como evidencia ante un incidente
const CHUNK_AUDIO_MS = 5000;
const TAMANO_VENTANA_AUDIO_MS = 15000;

const analizarFrame = async (intentoId: string, frame: string): Promise<AnalisisProctoring | null> => {
    try {
        const { data } = await api.post(`/estudiante/intentos/${intentoId}/analizar`, { frame });
        return data as AnalisisProctoring;
    } catch {
        return null;
    }
};

export const reportarIncidente = async (intentoId: string, tipo: string, descripcion?: string): Promise<ResultadoIncidente | null> => {
    try {
        const { data } = await api.post(`/estudiante/intentos/${intentoId}/incidentes`, { tipo, descripcion });
        return data as ResultadoIncidente;
    } catch {
        return null;
    }
};

export const cancelarExamen = async (intentoId: string) => {
    try {
        await api.post(`/estudiante/intentos/${intentoId}/cancelar`);
    } catch {
        // Best effort — el servidor puede haber cancelado el intento
    }
};

const subirEvidencia = async (
    intentoId: string,
    incidenteId: string | undefined,
    tipo: TipoEvidencia,
    blob: Blob,
    nombreArchivo: string
) => {
    try {
        const form = new FormData();
        form.append('archivo', blob, nombreArchivo);
        form.append('tipo', tipo);
        if (incidenteId) form.append('incidente_id', incidenteId);
        await api.post(`/estudiante/intentos/${intentoId}/evidencias`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    } catch {
        // Best effort — el incidente ya quedó registrado, la evidencia no es crítica
    }
};

const useProctoring = ({
    intentoId,
    supervisionActiva,
    onCancelado,
    version,
    stream: streamExterno,
}: UseProctoringOptions): ProctoringState => {
    // ── State ──────────────────────────────────────────────
    const [state, setState] = useState<ProctoringState>({
        permisoCamara: 'pending',
        permisoMicro: 'pending',
        fullscreenActivo: false,
        strikesRestantes: LIMITE_LLAMADAS,
        calibrando: false,
        calibracionProgreso: 0,
        blurAdvertencias: 0,
        error: null,
        nivelMovimiento: 0,
        nivelAudio: 0,
    });

    // ── Refs ───────────────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const strikesRef = useRef(0); // llamadas de atención según el servidor
    const canceladoRef = useRef(false);
    const ruidoContinuoRef = useRef(0);
    const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mountedRef = useRef(true);
    const streamExternoRef = useRef<MediaStream | null>(null);
    const inicializandoRef = useRef(true); // bloquea blur/visibility durante init
    // Canvas para capturar el frame que se envía al servicio Python
    const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    // Contadores para incidentes sostenidos (evita falsos positivos)
    const sinRostroContinuoRef = useRef(0);
    const ojosCerradosContinuoRef = useRef(0);
    const bocaAbiertaContinuoRef = useRef(0);
    const volteoContinuoRef = useRef(0);
    const fallosServicioRef = useRef(0);
    const analizandoRef = useRef(false);
    // Grabación continua de audio (ventana móvil) como evidencia
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRecorderRef = useRef<MediaRecorder | null>(null);
    const handleCancelacionRef = useRef<((motivo: string, yaCanceladoEnServidor?: boolean) => Promise<void>) | null>(null);
    const reportarYProcesarRef = useRef<((tipo: string, descripcion?: string) => Promise<void>) | null>(null);
    const actualizarStrikesRef = useRef<(() => void) | null>(null);

    // Sincronizar refs en cada render para que los effects NUNCA dependan de los callbacks
    const actualizarStrikes = useCallback(() => {
        setState(prev => ({ ...prev, strikesRestantes: Math.max(0, LIMITE_LLAMADAS - strikesRef.current) }));
    }, []);

    const handleCancelacion = useCallback(async (motivo: string, yaCanceladoEnServidor = false) => {
        if (canceladoRef.current || !mountedRef.current) return;
        canceladoRef.current = true;
        if (!yaCanceladoEnServidor) await cancelarExamen(intentoId);
        if (mountedRef.current) onCancelado(motivo);
    }, [intentoId, onCancelado]);

    // Captura un fotograma actual del video como evidencia
    const capturarFotograma = useCallback(async (): Promise<Blob | null> => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) return null;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(video, 0, 0);
            return await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.7));
        } catch {
            return null;
        }
    }, []);

    // Sube la evidencia del incidente: captura + ventana de audio
    const subirEvidenciasIncidente = useCallback(async (incidenteId?: string) => {
        const foto = await capturarFotograma();
        if (foto) await subirEvidencia(intentoId, incidenteId, 'CAPTURA', foto, `captura_${Date.now()}.jpg`);
        const chunks = audioChunksRef.current;
        if (chunks.length > 0) {
            const audio = new Blob(chunks, { type: 'audio/webm' });
            await subirEvidencia(intentoId, incidenteId, 'GRABACION', audio, `audio_${Date.now()}.webm`);
        }
    }, [intentoId, capturarFotograma]);

    // Reporta el incidente al servidor, actualiza las llamadas y decide si cancela
    const reportarYProcesar = useCallback(async (tipo: string, descripcion?: string) => {
        const resultado = await reportarIncidente(intentoId, tipo, descripcion);
        if (!resultado) return;
        if (typeof resultado.llamadas_atencion === 'number') {
            strikesRef.current = resultado.llamadas_atencion;
            actualizarStrikesRef.current?.();
        }
        if (resultado.cancelado && !canceladoRef.current) {
            void subirEvidenciasIncidente(resultado.incidente?.id);
            handleCancelacionRef.current?.(resultado.motivo || 'El examen fue cancelado', true);
        } else {
            void subirEvidenciasIncidente(resultado.incidente?.id);
        }
    }, [intentoId, subirEvidenciasIncidente]);

    handleCancelacionRef.current = handleCancelacion;
    reportarYProcesarRef.current = reportarYProcesar;
    actualizarStrikesRef.current = actualizarStrikes;

    // ── Init proctoring ────────────────────────────────────
    useEffect(() => {
        if (!supervisionActiva) return;
        // El PermissionGate gestiona los permisos y pasa el stream.
        // Si no hay stream, esperamos a que llegue (no llamamos getUserMedia acá).
        if (!streamExterno) return;

        // Resetear al re-ejecutarse (cuando cambia stream o version)
        mountedRef.current = true;

        const stream: MediaStream = streamExterno;
        streamExternoRef.current = streamExterno;
        streamRef.current = stream;
        setState(prev => ({ ...prev, permisoCamara: 'granted', permisoMicro: 'granted' }));

        // Calibrando
        setState(prev => ({ ...prev, calibrando: true }));

        (async () => {
            // Fullscreen
            try {
                await document.documentElement.requestFullscreen();
                if (mountedRef.current) setState(prev => ({ ...prev, fullscreenActivo: true }));
            } catch { /* fullscreen puede fallar si ya está activo */ }

            await new Promise(r => setTimeout(r, 100));
            if (!mountedRef.current || canceladoRef.current) return;

            // Audio context setup — DENTRO de la IIFE para poder await resume()
            try {
                const audioCtx = new AudioContext();
                await audioCtx.resume(); // necesario — puede arrancar suspended
                const src = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                src.connect(analyser);
                audioContextRef.current = audioCtx;
                analyserRef.current = analyser;
            } catch {
                // Audio monitoring failed — continue without it
            }

            // Crear video element para captura
            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            await video.play();
            videoRef.current = video;

            // Grabación continua de audio (ventana móvil de ~15s) como evidencia
            const trackAudio = stream.getAudioTracks()[0];
            if (trackAudio && typeof MediaRecorder !== 'undefined') {
                try {
                    const audioStream = new MediaStream([trackAudio]);
                    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
                        .find(t => MediaRecorder.isTypeSupported(t));
                    const recorder = new MediaRecorder(audioStream, mime ? { mimeType: mime } : undefined);
                    recorder.ondataavailable = (e) => {
                        if (e.data && e.data.size > 0) {
                            audioChunksRef.current.push(e.data);
                            const maxChunks = Math.ceil(TAMANO_VENTANA_AUDIO_MS / CHUNK_AUDIO_MS);
                            while (audioChunksRef.current.length > maxChunks) audioChunksRef.current.shift();
                        }
                    };
                    recorder.start(CHUNK_AUDIO_MS);
                    audioRecorderRef.current = recorder;
                } catch {
                    // Grabación continua no disponible — solo capturas de imagen
                }
            }

            // Setup canvas para capturar frames que se envían al servicio de análisis
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                if (mountedRef.current) setState(prev => ({ ...prev, error: 'El análisis de video no está disponible' }));
                inicializandoRef.current = false;
                setState(prev => ({ ...prev, calibrando: false }));
                return;
            }
            frameCanvasRef.current = canvas;
            frameCtxRef.current = ctx;

            // Esperar que el video tenga frames
            await new Promise<void>(resolve => {
                const check = () => {
                    if (video.videoWidth > 0 && video.videoHeight > 0) resolve();
                    else requestAnimationFrame(check);
                };
                check();
            });
            await new Promise(r => setTimeout(r, 200));
            if (!mountedRef.current || canceladoRef.current) return;

            // ── Calibration: frames por 5s, retry hasta pasar ──
            // El canvas se redimensiona a la resolución del análisis (320x240):
            // MediaPipe necesita resolución decente para detectar ojos/boca.
            const W = 320, H = 240;

            const ejecutarCalibracion = async (): Promise<boolean> => {
                if (!mountedRef.current || canceladoRef.current) return false;
                setState(prev => ({ ...prev, calibracionProgreso: 0, error: null }));

                canvas.width = W;
                canvas.height = H;

                const frames: ImageData[] = [];
                let ultimaMediaBrillo = 0;

                for (let i = 0; i < CALIBRACION_SEGUNDOS; i++) {
                    if (!mountedRef.current || canceladoRef.current) return false;
                    await new Promise(r => setTimeout(r, 1000));
                    if (!mountedRef.current || canceladoRef.current) return false;

                    ctx.drawImage(video, 0, 0, W, H);
                    const frame = ctx.getImageData(0, 0, W, H);
                    frames.push(frame);

                    // Brillo promedio (cámara no tapada / no apagada)
                    const data = frame.data;
                    let suma = 0;
                    for (let j = 0; j < data.length; j += 4) {
                        suma += (data[j] + data[j+1] + data[j+2]) / 3;
                    }
                    ultimaMediaBrillo = suma / (data.length / 4);

                    if (mountedRef.current) {
                        setState(prev => ({ ...prev, calibracionProgreso: ((i + 1) / CALIBRACION_SEGUNDOS) * 100 }));
                    }
                }

                if (!mountedRef.current || canceladoRef.current) return false;

                // Validación 1: brillo mínimo (cámara no tapada)
                const brilloOk = ultimaMediaBrillo >= 20 && !isNaN(ultimaMediaBrillo);

                // Validación 2: el servicio Python debe detectar un rostro real.
                // Si el servicio no responde (null), degradamos a la heurística
                // local de varianza para no bloquear al estudiante.
                let rostroOk = false;
                let servicioRespondio = false;
                try {
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    const frameB64 = dataUrl.split(',')[1];
                    const resultado = await analizarFrame(intentoId, frameB64);
                    servicioRespondio = resultado !== null;
                    rostroOk = !!resultado?.rostro_detectado;
                } catch {
                    servicioRespondio = false;
                }

                // Heurística local de respaldo: varianza mínima (una cara tiene textura)
                let varianzaOk = true;
                if (!servicioRespondio) {
                    let maxVarianza = 0;
                    for (const f of frames) {
                        const data = f.data;
                        let suma = 0;
                        for (let j = 0; j < data.length; j += 4) {
                            suma += (data[j] + data[j+1] + data[j+2]) / 3;
                        }
                        const media = suma / (data.length / 4);
                        const varianza = data.reduce(
                            (acc, _, j) => j % 4 === 3 ? acc : acc + (((data[j] + data[j-1] + data[j+1]) / 3) - media) ** 2,
                            0
                        ) / (data.length / 4);
                        if (varianza > maxVarianza) maxVarianza = varianza;
                    }
                    varianzaOk = maxVarianza > 800 && !isNaN(maxVarianza);
                }

                if (!brilloOk || (servicioRespondio && !rostroOk) || (!servicioRespondio && !varianzaOk)) {
                    if (mountedRef.current) {
                        const motivo = !brilloOk
                            ? 'No se detectó tu rostro. Asegurate de estar frente a la cámara.'
                            : servicioRespondio
                                ? 'No se detectó tu rostro. Asegurate de estar frente a la cámara.'
                                : 'La cámara solo ve una superficie lisa. Asegurate de estar frente a la cámara.';
                        setState(prev => ({ ...prev, error: motivo }));
                    }
                    return false;
                }

                return true;
            };

            // Loop hasta que la calibración pase
            while (mountedRef.current && !canceladoRef.current) {
                const ok = await ejecutarCalibracion();
                if (ok) break;
                // Mostrar error 2.5s, luego reintentar
                await new Promise(r => setTimeout(r, 2500));
            }

            if (!mountedRef.current || canceladoRef.current) return;

            inicializandoRef.current = false;
            setState(prev => ({ ...prev, calibrando: false, calibracionProgreso: 100 }));

            // ── Motion/rostro monitoring (servicio Python vía proxy) ──
            monitorIntervalRef.current = setInterval(async () => {
                if (!mountedRef.current || canceladoRef.current || !frameCtxRef.current || !frameCanvasRef.current || !videoRef.current) return;
                if (analizandoRef.current) return; // no solapar análisis lentos

                analizandoRef.current = true;
                try {
                    const c = frameCanvasRef.current;
                    const cx = frameCtxRef.current;
                    cx.drawImage(videoRef.current, 0, 0, c.width, c.height);
                    const dataUrl = c.toDataURL('image/jpeg', 0.7);
                    const frameB64 = dataUrl.split(',')[1];

                    const resultado = await analizarFrame(intentoId, frameB64);

                    if (!mountedRef.current || canceladoRef.current) return;

                    if (!resultado) {
                        // Servicio no disponible: avisar si lleva varios fallos seguidos
                        fallosServicioRef.current += 1;
                        if (fallosServicioRef.current >= FALLOS_SERVICIO_AVISO) {
                            setState(prev => prev.error ? prev : { ...prev, error: 'El servicio de análisis de cámara no responde. La supervisión visual está degradada.' });
                        }
                        return;
                    }
                    fallosServicioRef.current = 0;

                    // Nivel en vivo
                    setState(prev => ({ ...prev, nivelMovimiento: Math.round(resultado.movimiento * 1000) / 1000 }));

                    // ── Movimiento excesivo ──
                    if (resultado.movimiento > UMBRAL_MOVIMIENTO) {
                        void reportarYProcesarRef.current?.('MOVIMIENTO_SOSPECHOSO', `Dif: ${resultado.movimiento.toFixed(3)}`);
                    }

                    // ── Sin rostro sostenido → SIN_CAMARA ──
                    sinRostroContinuoRef.current = resultado.rostro_detectado
                        ? 0
                        : sinRostroContinuoRef.current + 1;
                    if (sinRostroContinuoRef.current >= CHECK_SOSTENIDO_SIN_ROSTRO) {
                        sinRostroContinuoRef.current = 0;
                        void reportarYProcesarRef.current?.('SIN_CAMARA', 'No se detectó tu rostro');
                    }

                    // ── Ojos cerrados sostenidos → MOVIMIENTO_SOSPECHOSO ──
                    ojosCerradosContinuoRef.current = !resultado.ojos_cerrados
                        ? 0
                        : ojosCerradosContinuoRef.current + 1;
                    if (ojosCerradosContinuoRef.current >= CHECK_SOSTENIDO_OJOS) {
                        ojosCerradosContinuoRef.current = 0;
                        void reportarYProcesarRef.current?.('MOVIMIENTO_SOSPECHOSO', 'Ojos cerrados detectados');
                    }

                    // ── Boca abierta sostenida → RUIDO (posible conversación) ──
                    bocaAbiertaContinuoRef.current = !resultado.boca_abierta
                        ? 0
                        : bocaAbiertaContinuoRef.current + 1;
                    if (bocaAbiertaContinuoRef.current >= CHECK_SOSTENIDO_BOCA) {
                        bocaAbiertaContinuoRef.current = 0;
                        void reportarYProcesarRef.current?.('RUIDO_SOSPECHOSO', 'Boca abierta (posible conversación)');
                    }

                    // ── Cabeza volteada sostenida → MOVIMIENTO_SOSPECHOSO ──
                    volteoContinuoRef.current = !resultado.cabeza_volteada
                        ? 0
                        : volteoContinuoRef.current + 1;
                    if (volteoContinuoRef.current >= CHECK_SOSTENIDO_VOLTEO) {
                        volteoContinuoRef.current = 0;
                        void reportarYProcesarRef.current?.('MOVIMIENTO_SOSPECHOSO', 'Cabeza volteada detectada');
                    }
                } finally {
                    analizandoRef.current = false;
                }
            }, INTERVALO_CAPTURA_MS);

            // Audio monitoring (RMS) — siempre activo
            audioIntervalRef.current = setInterval(() => {
                if (!mountedRef.current || canceladoRef.current || !analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteTimeDomainData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const val = (dataArray[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / dataArray.length);

                // Mostrar nivel en vivo
                setState(prev => ({ ...prev, nivelAudio: Math.round(rms * 1000) / 1000 }));

                // Integrador: sube con ruido sostenido, baja con silencio
                // Tolerante a micro-pausas del habla, evita falsos con picos aislados
                if (rms > UMBRAL_RUIDO) {
                    ruidoContinuoRef.current = Math.min(6, ruidoContinuoRef.current + 1);
                } else {
                    ruidoContinuoRef.current = Math.max(0, ruidoContinuoRef.current - 1);
                }

                // 4 de 6 checks (~1.5s de ruido en una ventana de 3s) → incidente
                if (ruidoContinuoRef.current >= 4) {
                    ruidoContinuoRef.current = 0;
                    void reportarYProcesarRef.current?.('RUIDO_SOSPECHOSO', `RMS: ${rms.toFixed(3)}`);
                }
            }, 500);
        })();

        // ── Cleanup ────────────────────────────────────────
        return () => {
            mountedRef.current = false;
            if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
            if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
                audioRecorderRef.current.stop();
            }
            audioChunksRef.current = [];
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.srcObject = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            // Cleanup canvas
            frameCanvasRef.current = null;
            frameCtxRef.current = null;
            sinRostroContinuoRef.current = 0;
            ojosCerradosContinuoRef.current = 0;
            bocaAbiertaContinuoRef.current = 0;
            volteoContinuoRef.current = 0;
            fallosServicioRef.current = 0;
            analizandoRef.current = false;
        };
    // handleCancelacion, actualizarStrikes y reportarYProcesar NO van en deps — se acceden
    // via ref para evitar que el effect se reinicie en cada render del padre (lo que mata el stream).
    }, [supervisionActiva, intentoId, version, streamExterno]);

    // ── Tab/window switch detection ─────────────────────────
    useEffect(() => {
        if (!supervisionActiva) return;

        const onVisibilityChange = () => {
            // No reportar durante inicialización (fullscreen, calibración)
            if (document.hidden && !canceladoRef.current && streamRef.current && !inicializandoRef.current) {
                // El servidor decide: 1ª llamada de atención, 2ª cancelación
                void reportarYProcesarRef.current?.('CAMBIO_VENTANA', 'El estudiante cambió de ventana/pestaña');
            }
        };

        const onBlur = () => {
            // Ignorar blur durante inicialización — requestFullscreen() puede disparar blur
            if (!canceladoRef.current && streamRef.current && !inicializandoRef.current) {
                // No reportamos incidente: el blur es común (devtools, notificaciones).
                // Solo mostramos una advertencia; el cambio real se detecta con visibilitychange.
                setState(prev => ({ ...prev, blurAdvertencias: prev.blurAdvertencias + 1 }));
            }
        };

        const onBeforeUnload = () => {
            if (!canceladoRef.current) {
                navigator.sendBeacon(
                    `http://localhost:3000/api/estudiante/intentos/${intentoId}/incidentes`,
                    JSON.stringify({ tipo: 'CIERRE_NAVEGADOR', descripcion: 'Navegador cerrado durante examen' })
                );
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);
        window.addEventListener('beforeunload', onBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    // La ref reportarYProcesarRef evita reiniciar event listeners en cada render
    }, [supervisionActiva, intentoId]);

    // ── Copy prevention ────────────────────────────────────
    useEffect(() => {
        if (!supervisionActiva) return;

        const preventDefault = (e: Event) => e.preventDefault();

        const onKeyDown = (e: KeyboardEvent) => {
            if (
                (e.ctrlKey || e.metaKey) &&
                ['c', 'v', 'x', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
            }
            if (e.key === 'F12') e.preventDefault();
            if (e.key === 'Escape' && !canceladoRef.current) {
                // Fullscreen escape is handled by fullscreenchange event
                // But we need to prevent default Escape behavior
                e.preventDefault();
            }
        };

        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('paste', preventDefault);
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('selectstart', preventDefault);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('paste', preventDefault);
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('selectstart', preventDefault);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [supervisionActiva]);

    // ── Fullscreen change detection ────────────────────────
    useEffect(() => {
        if (!supervisionActiva) return;

        const onFullscreenChange = () => {
            if (!document.fullscreenElement && !canceladoRef.current) {
                setState(prev => ({ ...prev, fullscreenActivo: false }));
                // The ResponderExamenPage will show the warning dialog
                // If user chooses to continue, re-request fullscreen
            } else if (document.fullscreenElement) {
                setState(prev => ({ ...prev, fullscreenActivo: true }));
            }
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, [supervisionActiva]);

    return state;
};

export default useProctoring;
