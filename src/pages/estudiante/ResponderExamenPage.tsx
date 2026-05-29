import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';

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
        // El intento ya fue creado al hacer clic en "Iniciar"
        // Aquí cargamos los datos del intento para mostrar el examen
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
            <div>
                <NavbarEstudiante />
                <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
                    <h2>✅ Examen entregado</h2>
                    <p style={{ color: '#666' }}>Tu examen fue enviado correctamente. Podrás ver tu calificación una vez que sea revisado.</p>
                    <button onClick={() => navigate('/estudiante/calificaciones')}
                        style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Ver calificaciones
                    </button>
                </div>
            </div>
        );
    }

    if (cargando) return <div><NavbarEstudiante /><p style={{ padding: '2rem' }}>Cargando examen...</p></div>;

    return (
        <div>
            <NavbarEstudiante />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>{examen?.titulo}</h2>
                    {segundos !== null && (
                        <span style={{ color: segundos < 60 ? '#E53E3E' : '#2D3748', fontWeight: 'bold', fontSize: '18px' }}>
                            ⏱ {formatTiempo(segundos)}
                        </span>
                    )}
                </div>

                {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                    {preguntas.map((pregunta, index) => (
                        <div key={pregunta.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
                            <p style={{ fontWeight: '500', margin: '0 0 0.25rem', fontSize: '14px', color: '#666' }}>
                                Pregunta {index + 1} — {pregunta.puntaje} pts
                            </p>
                            <p style={{ margin: '0 0 1rem', fontSize: '15px' }}>{pregunta.enunciado}</p>

                            {(pregunta.tipo === 'OPCION_MULTIPLE' || pregunta.tipo === 'VERDADERO_FALSO') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {pregunta.opciones.map(opcion => (
                                        <label key={opcion.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>
                                            <input type="radio" name={pregunta.id} value={opcion.id}
                                                checked={respuestas[pregunta.id]?.opciones_seleccionadas?.[0] === opcion.id}
                                                onChange={() => handleOpcion(pregunta.id, opcion.id)} />
                                            {opcion.texto}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {pregunta.tipo === 'ABIERTA' && (
                                <textarea rows={4} placeholder="Escribe tu respuesta aquí..."
                                    value={respuestas[pregunta.id]?.texto_respuesta || ''}
                                    onChange={e => handleTexto(pregunta.id, e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }} />
                            )}

                            {pregunta.tipo === 'RELACIONAR' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {pregunta.pares.map((par, i) => (
                                        <div key={par.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '14px', minWidth: '120px' }}>{par.lado_izquierdo}</span>
                                            <select onChange={e => handlePar(pregunta.id, par.lado_izquierdo, e.target.value, i)}
                                                style={{ padding: '0.3rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                                                <option value="">Seleccionar...</option>
                                                {pregunta.pares.map(p => <option key={p.id} value={p.lado_derecho}>{p.lado_derecho}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {pregunta.tipo === 'COMPLETAR' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {pregunta.espacios.map((esp, i) => (
                                        <div key={esp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '14px' }}>Espacio {esp.numero_espacio}:</span>
                                            <input placeholder="Tu respuesta"
                                                value={respuestas[pregunta.id]?.espacios_respuestas?.[i] || ''}
                                                onChange={e => handleEspacio(pregunta.id, e.target.value, i)}
                                                style={{ padding: '0.3rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '180px' }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button onClick={handleEntregar}
                    style={{ marginTop: '2rem', padding: '0.75rem 2rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', width: '100%' }}>
                    Entregar examen
                </button>
            </div>
        </div>
    );
};

export default ResponderExamenPage;