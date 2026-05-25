import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';

const DashboardEstudiante = () => {
    const { usuario } = useAuth();

    return (
        <div>
            <NavbarEstudiante />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h1>Bienvenido, {usuario?.nombre}</h1>
                <p style={{ color: '#666' }}>¿Qué quieres hacer hoy?</p>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <Link to="/estudiante/examenes" style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', width: '200px', textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: '2rem' }}>📝</div>
                            <h3 style={{ margin: '0.5rem 0 0', color: '#2D3748' }}>Exámenes</h3>
                            <p style={{ fontSize: '13px', color: '#666', margin: '0.25rem 0 0' }}>Ver exámenes disponibles</p>
                        </div>
                    </Link>

                    <Link to="/estudiante/calificaciones" style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', width: '200px', textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: '2rem' }}>🏆</div>
                            <h3 style={{ margin: '0.5rem 0 0', color: '#2D3748' }}>Calificaciones</h3>
                            <p style={{ fontSize: '13px', color: '#666', margin: '0.25rem 0 0' }}>Ver mis resultados</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardEstudiante;