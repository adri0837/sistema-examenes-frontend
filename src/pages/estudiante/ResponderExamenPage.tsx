import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';
import '../admin/Admin.css';

type TipoPregunta = 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'ABIERTA' | 'RELACIONAR' | 'COMPLETAR';

interface Opcion { id: string; texto: string; orden: number; }
interface Par { id: string; lado_izquierdo: string; lado_derecho: string; }
interface Espacio { id: string; numero_espacio: number; }
interface Pregunta {
    id: string; orden: number; enunciado: string; tipo: TipoPregunta; puntaje: number;
    opciones: Opcion[]; pares: Par[]; espacios: Espacio[];
}
interface Examen { titulo: string; tiempo_limite_min: number | null; }

const ResponderExamenPage = () => {
    const { id: intento_id } = useParams();
    const navigate = useNavigate();
    const [examen, setExamen] = useState<Examen | null>(null);
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [respuestas, setRespuestas] = useState<Record<string, any>>({});
    const [entregado, setEntregado] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [segundos, setSegundos] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                const { data } = await api.get(`/estudiante/intentos/${intento_id}`);
                setExamen(data.examen);
                setPreguntas(data.preguntas);
                if (data.examen.tiempo_limite_min) {
                    setSegundos(data.examen.tiempo_limite_min * 60);
                }
            } catch {
                setError('Error al cargar el examen');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [intento_id]);

    useEffect(() => {
        if (segundos === null) return;
        if (segundos <= 0) { handleEntregar(); return; }
        timerRef.current = setInterval(() => setSegundos(s => (s !== null ? s - 1 : null)), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [segundos]);

    const formatTiempo = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const handleOpcion = (pregunta_id: string, opcion_id: string) => {
        setRespuestas(prev => ({ ...prev, [pregunta_id]: { opciones_seleccionadas: [opcion_id] } }));
    };

    const handleTexto = (pregunta_id: string, texto: string) => {
        setRespuestas(prev => ({ ...prev, [pregunta_id]: { texto_respuesta: texto } }));
    };

    const handlePar = (pregunta_id: string, izquierdo: string, derecho: string, index: number) => {
        setRespuestas(prev => {
            const pares = prev[pregunta_id]?.pares_relacionados || [];
            const nuevos = [...pares];
            nuevos[index] = { izquierdo, derecho };
            return { ...prev, [pregunta_id]: { pares_relacionados: nuevos } };
        });
    };

    const handleEspacio = (pregunta_id: string, valor: string, index: number) => {
        setRespuestas(prev => {
            const espacios = prev[pregunta_id]?.espacios_respuestas || [];
            const nuevos = [...espacios];
            nuevos[index] = valor;
            return { ...prev, [pregunta_id]: { espacios_respuestas: nuevos } };
        });
    };

    const handleEntregar = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            const payload = preguntas.map(p => ({
                pregunta_id: p.id,
                ...respuestas[p.id],
            }));
            await api.post(`/estudiante/intentos/${intento_id}/entregar`, { respuestas: payload });
            setEntregado(true);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al entregar el examen');
        }
    };

    if (entregado) {
        return (
            <div className="admin-layout">
                <div className="admin-content-wrapper">
                    <NavbarEstudiante />
                    <div className="admin-page-container" style={{ textAlign: 'center', marginTop: '10vh' }}>
                        <div className="admin-form-card" style={{ padding: '4rem', maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                            <h2 style={{ fontSize: '2rem', color: '#f8fafc', marginBottom: '1rem' }}>Examen Entregado</h2>
                            <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>
                                Tu examen fue enviado correctamente. Podrás ver tu calificación una vez que sea revisado por tu profesor.
                            </p>
                            <button onClick={() => navigate('/estudiante/calificaciones')} className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
                                Ver mis calificaciones
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (cargando) return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarEstudiante />
                <div className="admin-page-container">
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>Cargando examen...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarEstudiante />
                <div className="admin-page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem', backdropFilter: 'blur(10px)', position: 'sticky', top: '1rem', zIndex: 10 }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>{examen?.titulo}</h2>
                        {segundos !== null && (
                            <span style={{ 
                                color: segundos < 60 ? '#f87171' : '#4ade80', 
                                fontWeight: 'bold', 
                                fontSize: '1.25rem',
                                background: 'rgba(0,0,0,0.3)',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: `1px solid ${segundos < 60 ? 'rgba(248, 113, 113, 0.3)' : 'rgba(74, 222, 128, 0.3)'}`
                            }}>
                                ⏱ {formatTiempo(segundos)}
                            </span>
                        )}
                    </div>

                    {error && <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {preguntas.map((pregunta, index) => (
                            <div key={pregunta.id} className="admin-form-card" style={{ padding: '2rem', borderLeft: '4px solid #3f2b96' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#a8c0ff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Pregunta {index + 1}
                                    </span>
                                    <span className="badge" style={{ background: 'rgba(168, 192, 255, 0.1)', color: '#a8c0ff', border: '1px solid rgba(168, 192, 255, 0.2)' }}>
                                        {pregunta.puntaje} pts
                                    </span>
                                </div>
                                
                                <p style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', color: '#f1f5f9', lineHeight: '1.6' }}>{pregunta.enunciado}</p>

                                {(pregunta.tipo === 'OPCION_MULTIPLE' || pregunta.tipo === 'VERDADERO_FALSO') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {pregunta.opciones.map(opcion => {
                                            const isSelected = respuestas[pregunta.id]?.opciones_seleccionadas?.[0] === opcion.id;
                                            return (
                                                <label key={opcion.id} style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', fontSize: '1.05rem',
                                                    background: isSelected ? 'rgba(83, 74, 183, 0.4)' : 'rgba(15, 23, 42, 0.4)',
                                                    padding: '1rem',
                                                    borderRadius: '8px',
                                                    border: isSelected ? '1px solid rgba(168, 192, 255, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                                                    transition: 'all 0.2s',
                                                    color: isSelected ? '#fff' : '#cbd5e1'
                                                }}>
                                                    <input type="radio" name={pregunta.id} value={opcion.id}
                                                        checked={isSelected}
                                                        onChange={() => handleOpcion(pregunta.id, opcion.id)} 
                                                        style={{ transform: 'scale(1.2)' }}
                                                    />
                                                    {opcion.texto}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {pregunta.tipo === 'ABIERTA' && (
                                    <textarea rows={5} placeholder="Escribe tu respuesta detallada aquí..."
                                        value={respuestas[pregunta.id]?.texto_respuesta || ''}
                                        onChange={e => handleTexto(pregunta.id, e.target.value)}
                                        style={{ 
                                            width: '100%', padding: '1rem', fontSize: '1.05rem', borderRadius: '8px', 
                                            border: '1px solid rgba(255,255,255,0.1)', resize: 'vertical', boxSizing: 'border-box',
                                            background: 'rgba(15, 23, 42, 0.6)', color: 'white', fontFamily: 'inherit'
                                        }} />
                                )}

                                {pregunta.tipo === 'RELACIONAR' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {pregunta.pares.map((par, i) => (
                                            <div key={par.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ fontSize: '1.05rem', minWidth: '150px', color: '#e2e8f0' }}>{par.lado_izquierdo}</span>
                                                <span style={{ color: '#64748b' }}>➜</span>
                                                <select onChange={e => handlePar(pregunta.id, par.lado_izquierdo, e.target.value, i)}
                                                    style={{ padding: '0.6rem 1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '1rem', background: 'rgba(30, 41, 59, 0.8)', color: 'white', flex: 1 }}>
                                                    <option value="" style={{ color: 'black' }}>Seleccionar respuesta...</option>
                                                    {pregunta.pares.map(p => <option key={p.id} value={p.lado_derecho} style={{ color: 'black' }}>{p.lado_derecho}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {pregunta.tipo === 'COMPLETAR' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {pregunta.espacios.map((esp, i) => (
                                            <div key={esp.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ fontSize: '1.05rem', color: '#e2e8f0', minWidth: '100px' }}>Espacio {esp.numero_espacio}:</span>
                                                <input placeholder="Escribe la palabra o frase"
                                                    value={respuestas[pregunta.id]?.espacios_respuestas?.[i] || ''}
                                                    onChange={e => handleEspacio(pregunta.id, e.target.value, i)}
                                                    style={{ padding: '0.6rem 1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '1rem', background: 'rgba(30, 41, 59, 0.8)', color: 'white', flex: 1 }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button onClick={handleEntregar} className="action-btn btn-success"
                        style={{ marginTop: '3rem', marginBottom: '3rem', padding: '1.2rem', fontSize: '1.2rem', width: '100%', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '12px', boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)' }}>
                        Finalizar y Entregar Examen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResponderExamenPage;