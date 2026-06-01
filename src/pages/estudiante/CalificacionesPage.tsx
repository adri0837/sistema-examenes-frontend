import { useState, useEffect } from 'react';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';
import { formatearCalificacion } from '../../utils/calificacion';
import '../admin/Admin.css';

interface Intento {
    id: string;
    estado: string;
    calificacion_final: number | null;
    entregado_en: string;
    examen: {
        titulo: string;
        descripcion: string | null;
        categoria: { nombre: string };
    };
}

const CalificacionesPage = () => {
    const [calificaciones, setCalificaciones] = useState<Intento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            try {
                const { data } = await api.get('/estudiante/calificaciones');
                setCalificaciones(data);
            } catch (e: any) {
                setError(e.response?.data?.message || e.message || 'Error al cargar calificaciones');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarEstudiante />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Mis Calificaciones</h2>
                    </div>
                    {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca' }}>{error}</p>}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando calificaciones...</p> : calificaciones.length === 0 ? (
                        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            <p>Aún no has completado ningún examen.</p>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Examen</th>
                                        <th>Categoría</th>
                                        <th>Fecha de Entrega</th>
                                        <th>Calificación Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calificaciones.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 500, fontSize: '15px' }}>{item.examen.titulo}</td>
                                            <td>
                                                <span className="badge badge-info">
                                                    {item.examen.categoria.nombre}
                                                </span>
                                            </td>
                                            <td style={{ color: '#6b7280' }}>{new Date(item.entregado_en).toLocaleDateString()} a las {new Date(item.entregado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>
                                                {item.estado === 'CALIFICADO'
                                                    ? <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>{formatearCalificacion(item.calificacion_final)}</span>
                                                    : <span className="badge badge-warning">En revisión</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalificacionesPage;