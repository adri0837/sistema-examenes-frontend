import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../pages/admin/Admin.css';

const NavbarAdmin = () => {
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
                <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>Inicio</Link>
                <Link to="/admin/usuarios" className={isActive('/admin/usuarios') ? 'active' : ''}>Usuarios</Link>
                <Link to="/admin/categorias" className={isActive('/admin/categorias') ? 'active' : ''}>Categorías</Link>
                <Link to="/admin/examenes" className={isActive('/admin/examenes') ? 'active' : ''}>Exámenes</Link>
                <Link to="/admin/revision" className={isActive('/admin/revision') ? 'active' : ''}>Revisión</Link>
                <Link to="/admin/reportes" className={isActive('/admin/reportes') ? 'active' : ''}>Reportes</Link>
            </div>

            <div className="admin-navbar-user">
                <span>{usuario?.nombre || 'Administrador'}</span>
                <button onClick={handleLogout} className="btn-logout">
                    Cerrar sesión
                </button>
            </div>
        </nav>
    );
};

export default NavbarAdmin;