import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NavbarEstudiante = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{ background: '#2D3748', color: 'white', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>ExamFlow</span>
                <Link to="/estudiante" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Inicio</Link>
                <Link to="/estudiante/examenes" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Exámenes</Link>
                <Link to="/estudiante/calificaciones" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Calificaciones</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '14px' }}>{usuario?.nombre}</span>
                <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: '#E53E3E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                    Cerrar sesión
                </button>
            </div>
        </nav>
    );
};

export default NavbarEstudiante;