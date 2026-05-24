import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import DashboardAdmin from '../pages/admin/DashboardAdmin';
import DashboardEstudiante from '../pages/estudiante/DashboardEstudiante';

const AppRouter = () => {
    const { usuario } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to={usuario.rol === 'ADMIN' ? '/admin' : '/estudiante'} replace />} />

                <Route path="/admin" element={
                    <ProtectedRoute rolRequerido="ADMIN">
                        <DashboardAdmin />
                    </ProtectedRoute>
                } />

                <Route path="/estudiante" element={
                    <ProtectedRoute rolRequerido="ESTUDIANTE">
                        <DashboardEstudiante />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;