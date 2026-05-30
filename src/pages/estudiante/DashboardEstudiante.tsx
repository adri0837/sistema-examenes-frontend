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

                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                        <Link to="/estudiante/examenes" style={{ textDecoration: 'none' }}>
                            <div className="admin-dashboard-card" style={{ width: '240px', padding: '2rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                                <h3 style={{ margin: '0', color: '#f8fafc', fontSize: '1.25rem' }}>Exámenes</h3>
                                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0.5rem 0 0' }}>Ver exámenes disponibles y realizar intentos</p>
                            </div>
                        </Link>

                        <Link to="/estudiante/calificaciones" style={{ textDecoration: 'none' }}>
                            <div className="admin-dashboard-card" style={{ width: '240px', padding: '2rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                                <h3 style={{ margin: '0', color: '#f8fafc', fontSize: '1.25rem' }}>Calificaciones</h3>
                                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0.5rem 0 0' }}>Ver mis resultados y progreso académico</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardEstudiante;