import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../pages/admin/Admin.css';

const NavbarEstudiante = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="admin-navbar">
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <span className="admin-navbar-logo">ExamFlow</span>
                <Link to="/estudiante" style={{ color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 500, letterSpacing: '0.3px' }}>Inicio</Link>
                <Link to="/estudiante/examenes" style={{ color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 500, letterSpacing: '0.3px' }}>Exámenes</Link>
                <Link to="/estudiante/calificaciones" style={{ color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 500, letterSpacing: '0.3px' }}>Calificaciones</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, background: 'rgba(255,255,255,0.1)', padding: '0.4rem 1rem', borderRadius: '99px' }}>{usuario?.nombre}</span>
                <button onClick={handleLogout} className="action-btn btn-danger" style={{ padding: '0.4rem 1rem', fontSize: '13px' }}>
                    Cerrar sesión
                </button>
            </div>
        </nav>
    );
};

export default NavbarEstudiante;