import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';
import type { ExamenDisponible } from '../../types';
import '../admin/Admin.css';

const intentoStorageKey = (examenId: string) => `intento_${examenId}`;

const getEstadoExamen = (intento: ExamenDisponible['intento']): 'disponible' | 'en_progreso' | 'completado' => {
    if (!intento) return 'disponible';
    if (intento.estado === 'EN_PROGRESO') return 'en_progreso';
    return 'completado';
};

const obtenerIntentoId = (examen: ExamenDisponible): string | null => {
    if (examen.intento?.id) return examen.intento.id;
    return localStorage.getItem(intentoStorageKey(examen.id));
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

    const handleContinuar = (examen: ExamenDisponible) => {
        const intentoId = obtenerIntentoId(examen);
        if (intentoId) {
            navigate(`/estudiante/examenes/${intentoId}`);
        } else {
            setError('No se pudo reanudar el examen. Contacta al administrador.');
        }
    };

    const renderEstado = (estado: ReturnType<typeof getEstadoExamen>) => {
        if (estado === 'completado') {
            return <span className="badge badge-active">Completado</span>;
        }
        if (estado === 'en_progreso') {
            return (
                <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    En progreso
                </span>
            );
        }
        return (
            <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                Disponible
            </span>
        );
    };

    const renderAccion = (examen: ExamenDisponible, estado: ReturnType<typeof getEstadoExamen>) => {
        if (estado === 'completado') {
            return <span style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>No disponible</span>;
        }
        if (estado === 'en_progreso') {
            return (
                <button onClick={() => handleContinuar(examen)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '13px' }}>
                    Continuar examen
                </button>
            );
        }
        return (
            <button onClick={() => handleIniciar(examen.id)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '13px' }}>
                Iniciar examen
            </button>
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
                    {error && <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

                    {cargando ? <p style={{ color: '#94a3b8' }}>Cargando exámenes...</p> : examenes.length === 0 ? (
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
                                        <th>Tiempo límite</th>
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
                                                    <span className="badge" style={{ background: 'rgba(168, 192, 255, 0.15)', color: '#a8c0ff', border: '1px solid rgba(168, 192, 255, 0.3)' }}>
                                                        {examen.categoria.nombre}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{examen._count.preguntas}</td>
                                                <td>{examen.tiempo_limite_min ? `${examen.tiempo_limite_min} min` : 'Sin límite'}</td>
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
