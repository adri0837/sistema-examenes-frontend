import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';
import type { ExamenDisponible } from '../../types';
import '../admin/Admin.css';

const intentoStorageKey = (examenId: string) => `intento_${examenId}`;

const getEstadoExamen = (intento: ExamenDisponible['intento']): 'disponible' | 'en_progreso' | 'completado' | 'cancelado' | 'reprobado' | 'reintentar' => {
    if (!intento) return 'disponible';
    if (intento.estado === 'EN_PROGRESO') return 'en_progreso';
    if (intento.estado === 'CANCELADO') return intento.reintento_permitido ? 'reintentar' : 'cancelado';
    if (intento.estado === 'REPROBADO') return intento.reintento_permitido ? 'reintentar' : 'reprobado';
    return 'completado';
};

const formatearFecha = (fecha: string | null) => {
    if (!fecha) return null;
    const f = new Date(fecha);
    return `${f.toLocaleDateString()} ${f.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const ExamenesDisponiblesPage = () => {
    const navigate = useNavigate();
    const [examenes, setExamenes] = useState<ExamenDisponible[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            try {
                const { data } = await api.get('/estudiante/examenes-disponibles');
                setExamenes(data);
            } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } }; message?: string };
                setError(e.response?.data?.message || e.message || 'Error al cargar exámenes');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    const handleIniciar = async (examen_id: string) => {
        try {
            setError('');
            const { data } = await api.post(`/estudiante/examenes/${examen_id}/iniciar`);
            localStorage.setItem(intentoStorageKey(examen_id), data.intento.id);
            navigate(`/estudiante/examenes/${data.intento.id}`);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Error al iniciar examen');
        }
    };

    const renderEstado = (estado: ReturnType<typeof getEstadoExamen>) => {
        if (estado === 'completado') return <span className="badge badge-active">Completado</span>;
        if (estado === 'en_progreso') return <span className="badge badge-danger">Abandonado</span>;
        if (estado === 'cancelado') return <span className="badge badge-warning">Cancelado</span>;
        if (estado === 'reprobado') return <span className="badge badge-danger">Reprobado</span>;
        if (estado === 'reintentar') return <span className="badge badge-warning">Reintento disponible</span>;
        return <span className="badge badge-info">Disponible</span>;
    };

    const renderAccion = (examen: ExamenDisponible, estado: ReturnType<typeof getEstadoExamen>) => {
        if (estado === 'reintentar') {
            return (
                <button onClick={() => handleIniciar(examen.id)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '13px' }}>
                    Reintentar examen
                </button>
            );
        }
        if (estado === 'completado' || estado === 'en_progreso' || estado === 'cancelado' || estado === 'reprobado') {
            return <span style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>No disponible</span>;
        }
        return (
            <button onClick={() => handleIniciar(examen.id)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '13px' }}>
                Iniciar examen
            </button>
        );
    };

    const renderVentana = (examen: ExamenDisponible) => {
        const inicio = formatearFecha(examen.asignacion?.fecha_inicio ?? null);
        const fin = formatearFecha(examen.asignacion?.fecha_fin ?? null);
        if (!inicio && !fin) return <span style={{ color: '#9ca3af' }}>—</span>;
        return (
            <span style={{ fontSize: '13px', color: '#64748b' }}>
                {inicio && `Desde: ${inicio}`}
                {inicio && fin && <br />}
                {fin && `Hasta: ${fin}`}
            </span>
        );
    };

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarEstudiante />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Exámenes Disponibles</h2>
                    </div>
                    {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca' }}>{error}</p>}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando exámenes...</p> : examenes.length === 0 ? (
                        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            <p>No hay exámenes publicados disponibles por el momento.</p>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Descripción</th>
                                        <th>Categoría</th>
                                        <th>Preguntas</th>
                                        <th>Ventana de rendición</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {examenes.map(examen => {
                                        const estado = getEstadoExamen(examen.intento);
                                        return (
                                            <tr key={examen.id}>
                                                <td style={{ fontWeight: 500 }}>{examen.titulo}</td>
                                                <td style={{ color: '#94a3b8' }}>{examen.descripcion || '—'}</td>
                                                <td>
                                                    <span className="badge badge-info">
                                                        {examen.categoria.nombre}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{examen._count.preguntas}</td>
                                                <td>{renderVentana(examen)}</td>
                                                <td>{renderEstado(estado)}</td>
                                                <td>{renderAccion(examen, estado)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamenesDisponiblesPage;
