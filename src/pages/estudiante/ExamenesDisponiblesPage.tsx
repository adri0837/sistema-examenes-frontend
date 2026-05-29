import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';

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
            } catch {
                setError('Error al cargar exámenes');
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
        <div>
            <NavbarEstudiante />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h2>Exámenes Disponibles</h2>
                {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

                {cargando ? <p style={{ color: '#666' }}>Cargando...</p> : examenes.length === 0 ? (
                    <p style={{ color: '#666', marginTop: '1rem' }}>No hay exámenes disponibles por el momento.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Título</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Descripción</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Categoría</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Preguntas</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Tiempo límite</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Estado</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {examenes.map(examen => (
                                <tr key={examen.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{examen.titulo}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px', color: '#666' }}>{examen.descripcion || '—'}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{examen.categoria.nombre}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{examen._count.preguntas}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{examen.tiempo_limite_min ? `${examen.tiempo_limite_min} min` : 'Sin límite'}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                        {examen.intento
                                            ? <span style={{ background: '#C6F6D5', color: '#276749', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Completado</span>
                                            : <span style={{ background: '#BEE3F8', color: '#2A69AC', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Disponible</span>
                                        }
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {examen.intento
                                            ? <span style={{ fontSize: '13px', color: '#999' }}>No disponible</span>
                                            : <button onClick={() => handleIniciar(examen.id)}
                                                style={{ padding: '0.35rem 0.75rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                                                Iniciar
                                            </button>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ExamenesDisponiblesPage;