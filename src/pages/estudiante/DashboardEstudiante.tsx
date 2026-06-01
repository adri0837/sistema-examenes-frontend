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
                <div className="admin-dashboard-container">
                    <div className="admin-dashboard-header">
                        <h1>Bienvenido, {usuario?.nombre}</h1>
                        <p>¿Qué quieres hacer hoy?</p>
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