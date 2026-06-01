import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import './Admin.css';

const tarjetas = [
    { titulo: 'Usuarios', descripcion: 'Gestionar estudiantes', emoji: '👥', ruta: '/admin/usuarios' },
    { titulo: 'Categorías', descripcion: 'Organizar temas de exámenes', emoji: '🗂️', ruta: '/admin/categorias' },
    { titulo: 'Exámenes', descripcion: 'Crear, editar y publicar exámenes', emoji: '📝', ruta: '/admin/examenes' },
    { titulo: 'Revisión', descripcion: 'Calificar respuestas abiertas', emoji: '✏️', ruta: '/admin/revision' },
    { titulo: 'Reportes', descripcion: 'Resultados y exportación', emoji: '📊', ruta: '/admin/reportes' },
];

const DashboardAdmin = () => {
    const { usuario } = useAuth();

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-dashboard-container">
                    <div className="admin-dashboard-header">
                        <h1>Bienvenido, {usuario?.nombre}</h1>
                        <p>Selecciona un módulo para comenzar.</p>
                    </div>
                    <div className="admin-cards-grid">
                        {tarjetas.map(t => (
                            <Link to={t.ruta} key={t.ruta} className="admin-card">
                                <div className="admin-card-emoji">{t.emoji}</div>
                                <h3 className="admin-card-title">{t.titulo}</h3>
                                <p className="admin-card-desc">{t.descripcion}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;