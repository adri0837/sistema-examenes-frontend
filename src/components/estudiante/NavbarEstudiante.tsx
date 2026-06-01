import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../pages/admin/Admin.css';

const NavbarEstudiante = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <nav className="admin-navbar">
            <div className="admin-navbar-logo">
                Sistema de Cuestionarios y Exámenes
            </div>

            <div className="admin-navbar-links">
                <Link to="/estudiante" className={location.pathname === '/estudiante' ? 'active' : ''}>Inicio</Link>
                <Link to="/estudiante/examenes" className={isActive('/estudiante/examenes') ? 'active' : ''}>Exámenes</Link>
                <Link to="/estudiante/calificaciones" className={isActive('/estudiante/calificaciones') ? 'active' : ''}>Calificaciones</Link>
            </div>

            <div className="admin-navbar-user">
                <span>{usuario?.nombre}</span>
                <button onClick={handleLogout} className="btn-logout">
                    Cerrar sesión
                </button>
            </div>
        </nav>
    );
};

export default NavbarEstudiante;