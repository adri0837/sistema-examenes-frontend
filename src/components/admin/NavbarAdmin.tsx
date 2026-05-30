import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NavbarAdmin = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="admin-navbar">
            <div className="admin-navbar-logo">
                ExamFlow Admin
            </div>
            
            <div className="admin-navbar-links">
                <Link to="/admin">Inicio</Link>
                <Link to="/admin/usuarios">Usuarios</Link>
                <Link to="/admin/categorias">Categorías</Link>
                <Link to="/admin/examenes">Exámenes</Link>
                <Link to="/admin/revision">Revisión</Link>
                <Link to="/admin/reportes">Reportes</Link>
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