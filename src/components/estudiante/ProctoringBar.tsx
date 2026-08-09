import type { ProctoringState } from '../../types';
import './Proctoring.css';

interface Props {
    state: ProctoringState;
}

// Umbrales visuales para la barra (más sensibles que los de strike)
const WARN_MOV = 0.04;
const ALERT_MOV = 0.08;
// dBFS: -60 ≈ silencio, -35 ≈ susurro, 0 ≈ escala completa
const WARN_AUDIO = -40;
const ALERT_AUDIO = -32;

const barStyle = (level: number) => {
    const pct = Math.min(100, level * 500); // escala: 0.20 = 100%
    const hue = level >= ALERT_MOV ? 0 : 120;
    return { width: `${Math.max(4, pct)}%`, background: `hsl(${hue}, 70%, 45%)` };
};

// Barra para dBFS: mapea [-60, 0] → 4%-100%
const barStyleAudio = (db: number) => {
    const pct = Math.max(4, Math.min(100, ((db + 60) / 60) * 100));
    const hue = db >= ALERT_AUDIO ? 0 : 120;
    return { width: `${pct}%`, background: `hsl(${hue}, 70%, 45%)` };
};

// Barra para yaw/pitch: mapea [0, 1.5] → 4%-100% (valores normalizados por ancho de ojos)
const barStylePose = (v: number) => {
    const pct = Math.max(4, Math.min(100, (Math.abs(v) / 1.5) * 100));
    const hue = Math.abs(v) >= 0.4 ? 0 : Math.abs(v) >= 0.2 ? 40 : 120;
    return { width: `${pct}%`, background: `hsl(${hue}, 70%, 45%)` };
};

const ProctoringBar = ({ state }: Props) => {
    const { permisoCamara, permisoMicro, fullscreenActivo, strikesRestantes, error, advertencia, nivelMovimiento, nivelAudio, nivelYaw, nivelPitch } = state;

    const strikeDots = [1, 2].map(i => {
        const diff = strikesRestantes - i;
        if (diff >= 1) return 'live';
        if (diff >= 0) return 'warning';
        return 'lost';
    });

    return (
        <div className="proctoring-bar">
            <div className="proctoring-bar-left">
                <span className="proctoring-bar-indicator">
                    <span className={`proctoring-bar-dot ${permisoCamara === 'granted' ? 'active' : 'error'}`} />
                    Cámara
                </span>
                <span className="proctoring-bar-indicator">
                    <span className={`proctoring-bar-dot ${permisoMicro === 'granted' ? 'active' : 'error'}`} />
                    Micrófono
                </span>
                <span className="proctoring-bar-indicator">
                    <span className={`proctoring-bar-dot ${fullscreenActivo ? 'active' : 'inactive'}`} />
                    Pantalla completa
                </span>
                <span className="proctoring-bar-label">Supervisión activa</span>
            </div>

            {/* Live indicators */}
            <div className="proctoring-bar-live">
                <span className="proctoring-live-item" title={`Movimiento: ${nivelMovimiento.toFixed(3)}`}>
                    <span className="proctoring-live-bar" style={barStyle(nivelMovimiento)} />
                    <span className={`proctoring-live-dot ${nivelMovimiento > ALERT_MOV ? 'alert' : nivelMovimiento > WARN_MOV ? 'warn' : 'ok'}`} />
                </span>
                <span className="proctoring-live-item" title={`Audio: ${nivelAudio.toFixed(1)} dBFS`}>
                    <span className="proctoring-live-bar" style={barStyleAudio(nivelAudio)} />
                    <span className={`proctoring-live-dot ${nivelAudio > ALERT_AUDIO ? 'alert' : nivelAudio > WARN_AUDIO ? 'warn' : 'ok'}`} />
                </span>
                <span className="proctoring-live-item" title={`Cabeza lateral (yaw): ${nivelYaw.toFixed(2)}`}>
                    <span className="proctoring-live-bar" style={barStylePose(nivelYaw)} />
                    <span className={`proctoring-live-dot ${Math.abs(nivelYaw) >= 0.4 ? 'alert' : Math.abs(nivelYaw) >= 0.2 ? 'warn' : 'ok'}`} />
                </span>
                <span className="proctoring-live-item" title={`Cabeza abajo/arriba (pitch): ${nivelPitch.toFixed(2)}`}>
                    <span className="proctoring-live-bar" style={barStylePose(nivelPitch)} />
                    <span className={`proctoring-live-dot ${Math.abs(nivelPitch) >= 0.9 ? 'alert' : Math.abs(nivelPitch) >= 0.5 ? 'warn' : 'ok'}`} />
                </span>
            </div>

            <div className="proctoring-bar-strikes">
                <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginRight: '0.3rem' }}>
                    Alertas:
                </span>
                {strikeDots.map((status, i) => (
                    <span key={i} className={`proctoring-strike-dot ${status}`} />
                ))}
            </div>
            {error && (
                <div className="proctoring-bar-error">
                    ⚠️ {error}
                </div>
            )}
            {advertencia && (
                <div className="proctoring-bar-warning">
                    ⚠️ {advertencia}
                </div>
            )}
        </div>
    );
};

export default ProctoringBar;
