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
        <nav style={{ background: '#1A202C', color: 'white', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>ExamFlow Admin</span>
                <Link to="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Inicio</Link>
                <Link to="/admin/usuarios" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Usuarios</Link>
                <Link to="/admin/categorias" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Categorías</Link>
                <Link to="/admin/examenes" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Exámenes</Link>
                <Link to="/admin/revision" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Revisión</Link>
                <Link to="/admin/reportes" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>Reportes</Link>
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

export default NavbarAdmin;