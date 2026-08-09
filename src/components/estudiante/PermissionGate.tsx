import { useState, useRef, useEffect } from 'react';
import './Proctoring.css';

interface Props {
    onPermisosConcedidos: (stream: MediaStream) => void;
    onDenegado: () => void;
}

const PermissionGate = ({ onPermisosConcedidos, onDenegado }: Props) => {
    const [camaraState, setCamaraState] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [microState, setMicroState] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [intentando, setIntentando] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const pasadoAlPadreRef = useRef(false);

    const solicitarPermisos = async () => {
        if (pasadoAlPadreRef.current) return;
        setIntentando(true);
        setCamaraState('pending');
        setMicroState('pending');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
                // Desactivar AGC/noise-suppression: el AGC normaliza el volumen y
                // destruiría la calibración del piso de ruido (imposible detectar susurros).
                audio: {
                    autoGainControl: false,
                    echoCancellation: false,
                    noiseSuppression: false,
                },
            });
            if (pasadoAlPadreRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
            streamRef.current = stream;
            setCamaraState('granted');
            setMicroState('granted');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            // No auto-advance — el usuario siempre confirma manualmente
            // para que vea el diálogo de permisos del navegador
        } catch {
            if (pasadoAlPadreRef.current) return;
            setCamaraState('denied');
            setMicroState('denied');
        } finally {
            setIntentando(false);
        }
    };

    useEffect(() => { solicitarPermisos(); }, []);

    // Cleanup on unmount — solo detener si NO pasamos el stream al padre
    useEffect(() => {
        return () => {
            if (streamRef.current && !pasadoAlPadreRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const denied = camaraState === 'denied' || microState === 'denied';

    return (
        <div className="proctoring-permission-overlay">
            <div className="proctoring-permission-card">
                <h2>🔒 Permisos necesarios</h2>
                <p>Para realizar este examen supervisado, necesitamos acceso a tu cámara y micrófono.</p>

                {camaraState === 'granted' && (
                    <video
                        ref={videoRef}
                        className="proctoring-permission-camera-preview"
                        autoPlay
                        muted
                        playsInline
                    />
                )}

                <div className="proctoring-permission-icons">
                    <div className={`proctoring-permission-icon ${camaraState === 'granted' ? 'granted' : camaraState === 'denied' ? 'denied' : ''}`}>
                        <span className="icon">
                            {camaraState === 'granted' ? '✅' : camaraState === 'denied' ? '❌' : '⏳'}
                        </span>
                        <span>Cámara</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            {camaraState === 'granted' ? 'Concedido' : camaraState === 'denied' ? 'Denegado' : 'Esperando...'}
                        </span>
                    </div>
                    <div className={`proctoring-permission-icon ${microState === 'granted' ? 'granted' : microState === 'denied' ? 'denied' : ''}`}>
                        <span className="icon">
                            {microState === 'granted' ? '✅' : microState === 'denied' ? '❌' : '⏳'}
                        </span>
                        <span>Micrófono</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            {microState === 'granted' ? 'Concedido' : microState === 'denied' ? 'Denegado' : 'Esperando...'}
                        </span>
                    </div>
                </div>

                {denied && (
                    <>
                        <p style={{ color: '#dc2626', fontSize: '0.88rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            No podemos continuar sin los permisos de cámara y micrófono.
                            Revisa la configuración de tu navegador y permite el acceso.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={solicitarPermisos}
                                disabled={intentando}
                                className="btn-primary"
                                style={{ padding: '0.65rem 1.5rem' }}
                            >
                                {intentando ? 'Intentando...' : 'Intentar de nuevo'}
                            </button>
                            <button
                                onClick={onDenegado}
                                className="action-btn"
                                style={{ padding: '0.65rem 1.5rem' }}
                            >
                                Cancelar examen
                            </button>
                        </div>
                    </>
                )}

                {!denied && camaraState === 'pending' && (
                    <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                        Solicitando permisos...
                    </p>
                )}

                {!denied && camaraState === 'granted' && (
                    <>
                        <p style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>
                            ✅ Permisos concedidos
                        </p>
                        <button
                            onClick={() => {
                                if (streamRef.current) {
                                    pasadoAlPadreRef.current = true;
                                    onPermisosConcedidos(streamRef.current);
                                }
                            }}
                            className="btn-primary"
                            style={{ padding: '0.65rem 2rem', fontSize: '1rem', marginTop: '0.5rem' }}
                        >
                            Comenzar supervisión
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PermissionGate;
