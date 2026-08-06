import { useNavigate } from 'react-router-dom';
import './Proctoring.css';

interface Props {
    motivo: string;
}

const ExamenCancelado = ({ motivo }: Props) => {
    const navigate = useNavigate();

    const motivoLabel = (m: string): string => {
        const map: Record<string, string> = {
            'Cambio de ventana detectado': 'Cambiaste de ventana o pestaña durante el examen.',
            'Permisos de cámara y micrófono denegados': 'No concediste los permisos necesarios de cámara y micrófono.',
            'Movimiento sospechoso': 'Se detectó movimiento sospechoso reiterado frente a la cámara.',
            'Ruido sospechoso detectado': 'Se detectó ruido excesivo durante el examen.',
            'Permisos denegados': 'No concediste los permisos necesarios.',
            'Saliste del modo de pantalla completa': 'Saliste del modo de pantalla completa durante el examen.',
            'El examen fue cancelado por acumular dos llamadas de atención': 'El examen fue cancelado por acumular dos llamadas de atención.',
            'examen cancelado por sin permisos': 'No se pudieron usar los permisos de cámara y micrófono.',
            'examen cancelado por cierre de navegador': 'Cerraste el navegador durante el examen.',
            'El examen fue cancelado': 'El examen fue cancelado por el sistema de supervisión.',
        };
        return map[m] || `Motivo: ${m}`;
    };

    return (
        <div className="proctoring-cancel-overlay">
            <div className="proctoring-cancel-card">
                <div className="icon">🔴</div>
                <h2>Examen Cancelado</h2>
                <p>{motivoLabel(motivo)}</p>
                <p style={{ fontSize: '0.88rem', color: '#9ca3af' }}>
                    El examen ha sido cancelado y no podrás continuar.
                    Contacta a tu administrador si crees que esto fue un error.
                </p>
                <button
                    onClick={() => navigate('/estudiante/examenes')}
                    className="btn-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                >
                    Volver a mis exámenes
                </button>
            </div>
        </div>
    );
};

export default ExamenCancelado;
