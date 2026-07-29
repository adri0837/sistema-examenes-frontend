import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProctoringState, UseProctoringOptions } from '../types';
import api from '../api/axios';

const STRIKES_MAX = 3;
// ponytail: 0.08 detecta movimiento de cabeza, 0.02-0.05 es ruido normal
const UMBRAL_MOVIMIENTO = 0.08;
const INTERVALO_CAPTURA_MS = 2000;
const CALIBRACION_SEGUNDOS = 5;
// ponytail: 0.08 RMS = conversación normal a 30cm
const UMBRAL_RUIDO = 0.08;

const reportarIncidente = async (intentoId: string, tipo: string, descripcion?: string) => {
    try {
        const { data } = await api.post(`/estudiante/intentos/${intentoId}/incidentes`, { tipo, descripcion });
        return data as { incidente: any; cancelado?: boolean; motivo?: string; strikes?: number };
    } catch {
        return null;
    }
};

const cancelarExamen = async (intentoId: string) => {
    try {
        await api.post(`/estudiante/intentos/${intentoId}/cancelar`);
    } catch {
        // Best effort — server may have already cancelled
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
        strikesRestantes: STRIKES_MAX,
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
    const strikesRef = useRef(0);
    const canceladoRef = useRef(false);
    const ruidoContinuoRef = useRef(0);
    const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mountedRef = useRef(true);
    const streamExternoRef = useRef<MediaStream | null>(null);
    const inicializandoRef = useRef(true); // bloquea blur/visibility durante init
    // Canvas-based motion detection (sin TF.js)
    const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const motionCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const motionBaselineRef = useRef<ImageData | null>(null);
    const handleCancelacionRef = useRef<((motivo: string) => Promise<void>) | null>(null);
    const actualizarStrikesRef = useRef<(() => void) | null>(null);

    // Sincronizar refs en cada render para que el effect NUNCA dependa de los callbacks
    const actualizarStrikes = useCallback(() => {
        setState(prev => ({ ...prev, strikesRestantes: STRIKES_MAX - strikesRef.current }));
    }, []);

    const handleCancelacion = useCallback(async (motivo: string) => {
        if (canceladoRef.current || !mountedRef.current) return;
        canceladoRef.current = true;
        await cancelarExamen(intentoId);
        if (mountedRef.current) onCancelado(motivo);
    }, [intentoId, onCancelado]);

    handleCancelacionRef.current = handleCancelacion;
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
            } catch {}

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

            // Setup canvas para motion detection (ponytail: sin TF.js, canvas puro, 0 dependencias)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                if (mountedRef.current) setState(prev => ({ ...prev, error: 'Detección de movimiento no disponible' }));
                inicializandoRef.current = false;
                setState(prev => ({ ...prev, calibrando: false }));
                return;
            }
            motionCanvasRef.current = canvas;
            motionCtxRef.current = ctx;

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

            // ── Calibration: canvas frames por 5s, retry hasta pasar ──
            const W = 80, H = 60; // low-res para performance

            const ejecutarCalibracion = async (): Promise<boolean> => {
                if (!mountedRef.current || canceladoRef.current) return false;
                setState(prev => ({ ...prev, calibracionProgreso: 0, error: null }));

                canvas.width = W;
                canvas.height = H;

                const frames: ImageData[] = [];
                let ultimaMediaBrillo = 0;
                let maxVarianza = 0;

                for (let i = 0; i < CALIBRACION_SEGUNDOS; i++) {
                    if (!mountedRef.current || canceladoRef.current) return false;
                    await new Promise(r => setTimeout(r, 1000));
                    if (!mountedRef.current || canceladoRef.current) return false;

                    ctx.drawImage(video, 0, 0, W, H);
                    const frame = ctx.getImageData(0, 0, W, H);
                    frames.push(frame);

                    // Calcular brillo promedio Y varianza (una cara tiene alto contraste)
                    const data = frame.data;
                    let suma = 0;
                    const vals: number[] = [];
                    for (let j = 0; j < data.length; j += 4) {
                        const b = (data[j] + data[j+1] + data[j+2]) / 3;
                        suma += b;
                        vals.push(b);
                    }
                    ultimaMediaBrillo = suma / vals.length;
                    const varianza = vals.reduce((acc, v) => acc + (v - ultimaMediaBrillo) ** 2, 0) / vals.length;
                    if (varianza > maxVarianza) maxVarianza = varianza;

                    if (mountedRef.current) {
                        setState(prev => ({ ...prev, calibracionProgreso: ((i + 1) / CALIBRACION_SEGUNDOS) * 100 }));
                    }
                }

                if (!mountedRef.current || canceladoRef.current) return false;

                // Validación 1: brillo mínimo (cámara no tapada)
                const brilloOk = ultimaMediaBrillo >= 20 && !isNaN(ultimaMediaBrillo);

                // Validación 2: hubo movimiento entre frames (no es una foto fija)
                let huboMovimiento = false;
                if (frames.length >= 2) {
                    for (let f = 1; f < frames.length; f++) {
                        const prev = frames[f-1].data;
                        const curr = frames[f].data;
                        let diff = 0;
                        for (let j = 0; j < prev.length; j += 4) {
                            diff += Math.abs(curr[j] - prev[j]) + Math.abs(curr[j+1] - prev[j+1]) + Math.abs(curr[j+2] - prev[j+2]);
                        }
                        const diffNorm = diff / (prev.length / 4 * 3 * 255);
                        // ponytail: 0.03 separa ruido de cámara (~0.015) de movimiento real
                        if (diffNorm > 0.03) {
                            huboMovimiento = true;
                            break;
                        }
                    }
                }

                // Validación 3: varianza mínima (una cara tiene textura, una pared no)
                // Una cara típica tiene varianza 2000-8000 en 80x60, una pared lisa ~200-800
                const varianzaOk = maxVarianza > 800 && !isNaN(maxVarianza);

                if (!brilloOk || !huboMovimiento || !varianzaOk) {
                    if (mountedRef.current) {
                        const motivo = !brilloOk
                            ? 'No se detectó tu rostro. Asegurate de estar frente a la cámara.'
                            : !varianzaOk
                                ? 'La cámara solo ve una superficie lisa. Asegurate de estar frente a la cámara.'
                                : 'No se detectó movimiento. Mové la cabeza suavemente frente a la cámara.';
                        setState(prev => ({ ...prev, error: motivo }));
                    }
                    return false;
                }

                // Usar el último frame como baseline
                motionBaselineRef.current = frames[frames.length - 1];
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

            // ── Motion monitoring (canvas frame-diff, sin TF.js) ──
            if (motionBaselineRef.current) {
                monitorIntervalRef.current = setInterval(() => {
                    if (!mountedRef.current || canceladoRef.current || !motionCtxRef.current || !motionCanvasRef.current || !videoRef.current || !motionBaselineRef.current) return;

                    const c = motionCanvasRef.current;
                    const cx = motionCtxRef.current!;
                    cx.drawImage(videoRef.current!, 0, 0, c.width, c.height);
                    const current = cx.getImageData(0, 0, c.width, c.height);
                    const baseline = motionBaselineRef.current;

                    let diffTotal = 0;
                    const d = current.data;
                    const b = baseline.data;
                    const len = Math.min(d.length, b.length);
                    for (let j = 0; j < len; j += 4) {
                        diffTotal += Math.abs(d[j] - b[j]) + Math.abs(d[j+1] - b[j+1]) + Math.abs(d[j+2] - b[j+2]);
                    }
                    const diffNorm = diffTotal / (len / 4 * 3 * 255);

                    // Mostrar nivel en vivo
                    setState(prev => ({ ...prev, nivelMovimiento: Math.round(diffNorm * 1000) / 1000 }));

                    if (diffNorm > UMBRAL_MOVIMIENTO) {
                        strikesRef.current += 1;
                        actualizarStrikesRef.current?.();
                        reportarIncidente(intentoId, 'MOVIMIENTO_SOSPECHOSO', `Dif: ${diffNorm.toFixed(3)}`);
                        if (strikesRef.current >= STRIKES_MAX) {
                            handleCancelacionRef.current?.('Movimiento sospechoso');
                        }
                    }

                    // Actualizar baseline al frame actual para que la próxima comparación
                    // sea contra el frame anterior, no contra una foto congelada de calibración.
                    // Sin esto, moverse UNA vez suma strikes infinitos aunque el alumno esté quieto.
                    motionBaselineRef.current = current;
                }, INTERVALO_CAPTURA_MS);
            }

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

                // 4 de 6 checks (~1.5s de ruido en una ventana de 3s) → strike
                if (ruidoContinuoRef.current >= 4) {
                    ruidoContinuoRef.current = 0;
                    strikesRef.current += 1;
                    actualizarStrikesRef.current?.();
                    reportarIncidente(intentoId, 'RUIDO_SOSPECHOSO', `RMS: ${rms.toFixed(3)}`);
                    if (strikesRef.current >= STRIKES_MAX) {
                        handleCancelacionRef.current?.('Ruido sospechoso detectado');
                    }
                }
            }, 500);
        })();

        // ── Cleanup ────────────────────────────────────────
        return () => {
            mountedRef.current = false;
            if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
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
            motionCanvasRef.current = null;
            motionCtxRef.current = null;
            motionBaselineRef.current = null;
        };
    // handleCancelacion y actualizarStrikes NO van en deps — se acceden via ref para evitar
    // que el effect se reinicie en cada render del padre (lo que mata el stream de cámara).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supervisionActiva, intentoId, version, streamExterno]);

    // ── Tab/window switch detection ─────────────────────────
    useEffect(() => {
        if (!supervisionActiva) return;

        const onVisibilityChange = () => {
            // No cancelar durante inicialización (fullscreen, calibración)
            if (document.hidden && !canceladoRef.current && streamRef.current && !inicializandoRef.current) {
                reportarIncidente(intentoId, 'CAMBIO_VENTANA', 'El estudiante cambió de ventana/pestaña');
                handleCancelacionRef.current?.('Cambio de ventana detectado');
            }
        };

        const onBlur = () => {
            // Ignorar blur durante inicialización — requestFullscreen() puede disparar blur
            if (!canceladoRef.current && streamRef.current && !inicializandoRef.current) {
                reportarIncidente(intentoId, 'CAMBIO_VENTANA', 'La ventana perdió el foco');
                // No cancelamos directo — mostramos advertencia tipo "como con esc y f11"
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
    // La ref handleCancelacionRef evita reiniciar event listeners en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                // Show warning handled by fullscreenchange
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
