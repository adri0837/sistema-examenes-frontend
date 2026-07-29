import { useEffect, useRef } from 'react';
import './Proctoring.css';

interface Props {
    progreso: number; // 0-100
    stream: MediaStream | null;
    error?: string | null;
}

const ProctoringConfigModal = ({ progreso, stream, error }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const segundosRestantes = Math.max(0, Math.ceil((100 - progreso) / 20));

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="proctoring-calibration-overlay">
            <div className="proctoring-calibration-card">
                <h2>📷 Configuración de supervisión</h2>
                <p>Centrá tu rostro dentro del óvalo</p>

                {stream && (
                    <div className="proctoring-calibration-video-wrapper">
                        <video
                            ref={videoRef}
                            className="proctoring-calibration-feed"
                            autoPlay
                            muted
                            playsInline
                        />
                        <div className="proctoring-calibration-face-guide" />
                    </div>
                )}

                <div className="proctoring-calibration-countdown">
                    {error ? (
                        <span>🔄 Reintentando…</span>
                    ) : segundosRestantes > 0 ? (
                        <span>Calibrando… <strong>{segundosRestantes}s</strong></span>
                    ) : (
                        <span>✅ Calibrado</span>
                    )}
                </div>

                {segundosRestantes > 0 && !error && (
                    <p style={{ color: '#16a34a', fontSize: '0.82rem', marginTop: '0.5rem', fontWeight: 600 }}>
                        Mové la cabeza suavemente
                    </p>
                )}

                <div className="proctoring-calibration-progress">
                    <div
                        className="proctoring-calibration-progress-bar"
                        style={{ width: `${progreso}%` }}
                    />
                </div>

                {segundosRestantes > 0 && !error && (
                    <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: '0.75rem' }}>
                        Mové la cabeza suavemente para verificar tu identidad
                    </p>
                )}

                {error && (
                    <p style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '0.75rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        ⚠️ {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProctoringConfigModal;
