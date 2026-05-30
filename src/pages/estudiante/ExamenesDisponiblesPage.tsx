import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';
import '../admin/Admin.css';

interface Intento {
    estado: string;
    calificacion_final: number | null;
}

interface Examen {
    id: string;
    titulo: string;
    descripcion: string | null;
    categoria: { nombre: string };
    tiempo_limite_min: number | null;
    _count: { preguntas: number };
    intento: Intento | null;
}

const ExamenesDisponiblesPage = () => {
    const navigate = useNavigate();
    const [examenes, setExamenes] = useState<Examen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            try {
                const { data } = await api.get('/estudiante/examenes-disponibles');
                setExamenes(data);
            } catch (e: any) {
                setError(e.response?.data?.message || e.message || 'Error al cargar exámenes');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    const handleIniciar = async (examen_id: string) => {
        try {
            const { data } = await api.post(`/estudiante/examenes/${examen_id}/iniciar`);
            navigate(`/estudiante/examenes/${data.intento.id}`);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al iniciar examen');
        }
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
                            <p>No hay exámenes disponibles por el momento.</p>
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
                                    {examenes.map(examen => (
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
                                            <td>
                                                {examen.intento
                                                    ? <span className="badge badge-active">Completado</span>
                                                    : <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>Disponible</span>
                                                }
                                            </td>
                                            <td>
                                                {examen.intento
                                                    ? <span style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>No disponible</span>
                                                    : <button onClick={() => handleIniciar(examen.id)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '13px' }}>
                                                        Iniciar examen
                                                    </button>
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

export default ExamenesDisponiblesPage;