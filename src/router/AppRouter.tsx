import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegistroPage from '../pages/auth/RegistroPage';

// Estudiante
import DashboardEstudiante from '../pages/estudiante/DashboardEstudiante';
import ExamenesDisponiblesPage from '../pages/estudiante/ExamenesDisponiblesPage';
import ResponderExamenPage from '../pages/estudiante/ResponderExamenPage';
import CalificacionesPage from '../pages/estudiante/CalificacionesPage';

// Admin
import DashboardAdmin from '../pages/admin/DashboardAdmin';
import UsuariosPage from '../pages/admin/UsuariosPage';
import CategoriasPage from '../pages/admin/CategoriasPage';
import ExamenesPage from '../pages/admin/ExamenesPage';
import ExamenDetallePage from '../pages/admin/ExamenDetallePage';
import RevisionPage from '../pages/admin/RevisionPage';
import ReportesPage from '../pages/admin/ReportesPage';
import SupervisionPage from '../pages/admin/SupervisionPage';
import GruposPage from '../pages/admin/GruposPage';

const AppRouter = () => {
    const { usuario } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to={usuario.rol === 'ADMIN' ? '/admin' : '/estudiante'} replace />} />
                <Route path="/registro" element={!usuario ? <RegistroPage /> : <Navigate to={usuario.rol === 'ADMIN' ? '/admin' : '/estudiante'} replace />} />

                {/* Estudiante */}
                <Route path="/estudiante" element={<ProtectedRoute rolRequerido="ESTUDIANTE"><DashboardEstudiante /></ProtectedRoute>} />
                <Route path="/estudiante/examenes" element={<ProtectedRoute rolRequerido="ESTUDIANTE"><ExamenesDisponiblesPage /></ProtectedRoute>} />
                <Route path="/estudiante/examenes/:id" element={<ProtectedRoute rolRequerido="ESTUDIANTE"><ResponderExamenPage /></ProtectedRoute>} />
                <Route path="/estudiante/calificaciones" element={<ProtectedRoute rolRequerido="ESTUDIANTE"><CalificacionesPage /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<ProtectedRoute rolRequerido="ADMIN"><DashboardAdmin /></ProtectedRoute>} />
                <Route path="/admin/usuarios" element={<ProtectedRoute rolRequerido="ADMIN"><UsuariosPage /></ProtectedRoute>} />
                <Route path="/admin/categorias" element={<ProtectedRoute rolRequerido="ADMIN"><CategoriasPage /></ProtectedRoute>} />
                <Route path="/admin/examenes" element={<ProtectedRoute rolRequerido="ADMIN"><ExamenesPage /></ProtectedRoute>} />
                <Route path="/admin/examenes/:id" element={<ProtectedRoute rolRequerido="ADMIN"><ExamenDetallePage /></ProtectedRoute>} />
                <Route path="/admin/revision" element={<ProtectedRoute rolRequerido="ADMIN"><RevisionPage /></ProtectedRoute>} />
                <Route path="/admin/supervision" element={<ProtectedRoute rolRequerido="ADMIN"><SupervisionPage /></ProtectedRoute>} />
                <Route path="/admin/grupos" element={<ProtectedRoute rolRequerido="ADMIN"><GruposPage /></ProtectedRoute>} />
                <Route path="/admin/reportes" element={<ProtectedRoute rolRequerido="ADMIN"><ReportesPage /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;