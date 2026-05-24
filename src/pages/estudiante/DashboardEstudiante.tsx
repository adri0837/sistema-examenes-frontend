import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const DashboardEstudiante = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Panel de Estudiante</h1>
            <p>Bienvenido, {usuario?.nombre}</p>
            <button onClick={handleLogout}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cerrar sesión
            </button>
        </div>
    );
};

export default DashboardEstudiante;