import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import '../admin/Admin.css';

const DashboardEstudiante = () => {
    const { usuario } = useAuth();

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarEstudiante />
                <div className="admin-page-container">
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 0.5rem', background: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Bienvenido, {usuario?.nombre}
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>¿Qué quieres hacer hoy?</p>
                    </div>

                    <div className="admin-cards-grid">
                        <Link to="/estudiante/examenes" className="admin-card">
                            <div className="admin-card-emoji">📝</div>
                            <h3 className="admin-card-title">Exámenes</h3>
                            <p className="admin-card-desc">Ver exámenes disponibles y realizar intentos</p>
                        </Link>

                        <Link to="/estudiante/calificaciones" className="admin-card">
                            <div className="admin-card-emoji">🏆</div>
                            <h3 className="admin-card-title">Calificaciones</h3>
                            <p className="admin-card-desc">Ver mis resultados y progreso académico</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardEstudiante;