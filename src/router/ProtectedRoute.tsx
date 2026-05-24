import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Rol } from '../types';

interface Props {
    children: React.ReactElement;
    rolRequerido: Rol;
}

const ProtectedRoute = ({ children, rolRequerido }: Props) => {
    const { usuario } = useAuth();

    if (!usuario) return <Navigate to="/login" replace />;
    if (usuario.rol !== rolRequerido) return <Navigate to="/login" replace />;

    return children;
};

export default ProtectedRoute;