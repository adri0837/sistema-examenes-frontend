import { Link } from 'react-router-dom';
import NavbarAdmin from '../../components/admin/NavbarAdmin';

const tarjetas = [
    { titulo: 'Usuarios', descripcion: 'Gestionar estudiantes', emoji: '👥', ruta: '/admin/usuarios' },
    { titulo: 'Categorías', descripcion: 'Organizar exámenes', emoji: '🗂️', ruta: '/admin/categorias' },
    { titulo: 'Exámenes', descripcion: 'Crear y publicar exámenes', emoji: '📝', ruta: '/admin/examenes' },
    { titulo: 'Revisión', descripcion: 'Calificar respuestas abiertas', emoji: '✏️', ruta: '/admin/revision' },
    { titulo: 'Reportes', descripcion: 'Ver resultados y exportar', emoji: '📊', ruta: '/admin/reportes' },
];

const DashboardAdmin = () => {
    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h1>Panel de Administrador</h1>
                <p style={{ color: '#666' }}>Selecciona una sección para comenzar.</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
                    {tarjetas.map(t => (
                        <Link to={t.ruta} key={t.ruta} style={{ textDecoration: 'none' }}>
                            <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', width: '180px', textAlign: 'center', cursor: 'pointer' }}>
                                <div style={{ fontSize: '2rem' }}>{t.emoji}</div>
                                <h3 style={{ margin: '0.5rem 0 0', color: '#2D3748' }}>{t.titulo}</h3>
                                <p style={{ fontSize: '13px', color: '#666', margin: '0.25rem 0 0' }}>{t.descripcion}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;