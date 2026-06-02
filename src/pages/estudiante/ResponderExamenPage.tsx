import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';
import type { TipoPregunta, RespuestaEntrega } from '../../types';
import '../admin/Admin.css';

interface Opcion { id: string; texto: string; orden: number; }
interface Par { id: string; lado_izquierdo: string; lado_derecho: string; }
interface Espacio { id: string; numero_espacio: number; }
interface Pregunta {
    id: string; orden: number; enunciado: string; tipo: TipoPregunta; puntaje: number;
    tiempo_limite_seg: number | null;
    opciones: Opcion[]; pares: Par[]; espacios: Espacio[];
}
interface Examen { id: string; titulo: string; }

const mezclar = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const ResponderExamenPage = () => {
    const { id: intento_id } = useParams();
    const navigate = useNavigate();
    const [examen, setExamen] = useState<Examen | null>(null);
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [respuestas, setRespuestas] = useState<Record<string, Partial<RespuestaEntrega>>>({});
    const [indicePregunta, setIndicePregunta] = useState(0);
    const [segundosPregunta, setSegundosPregunta] = useState<number | null>(null);
    const [entregado, setEntregado] = useState(false);
    const [entregando, setEntregando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const entregandoRef = useRef(false);
    const avanzandoRef = useRef(false);

    const derechosMezclados = useMemo(() => {
        const mapa: Record<string, string[]> = {};
        preguntas.forEach(p => {
            if (p.tipo === 'RELACIONAR') {
                mapa[p.id] = mezclar(p.pares.map(par => par.lado_derecho));
            }
        });
        return mapa;
    }, [preguntas]);

    useEffect(() => {
        const cargar = async () => {
            try {
                const { data } = await api.get(`/estudiante/intentos/${intento_id}`);
                setExamen(data.examen);
                setPreguntas(data.preguntas);
                if (data.examen?.id) {
                    localStorage.setItem(`intento_${data.examen.id}`, data.intento.id);
                }
                // Iniciar timer de la primera pregunta
                if (data.preguntas[0]?.tiempo_limite_seg) {
                    setSegundosPregunta(data.preguntas[0].tiempo_limite_seg * 60);
                } else {
                    setSegundosPregunta(null);
                }
            } catch {
                setError('Error al cargar el examen. Puede que ya haya sido entregado.');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [intento_id]);

    const preguntaActual = preguntas[indicePregunta];
    const esUltimaPregunta = indicePregunta === preguntas.length - 1;

    const handleEntregar = useCallback(async () => {
        if (entregandoRef.current || entregado) return;
        entregandoRef.current = true;
        setEntregando(true);
        try {
            const payload: RespuestaEntrega[] = preguntas.map(p => ({
                pregunta_id: p.id,
                ...respuestas[p.id],
            }));
            await api.post(`/estudiante/intentos/${intento_id}/entregar`, { respuestas: payload });
            if (examen?.id) localStorage.removeItem(`intento_${examen.id}`);
            setEntregado(true);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Error al entregar el examen');
            entregandoRef.current = false;
            setEntregando(false);
        }
    }, [entregado, preguntas, respuestas, intento_id, examen?.id]);

    const avanzarPregunta = useCallback(() => {
        if (avanzandoRef.current) return;
        avanzandoRef.current = true;

        setIndicePregunta(prev => {
            const siguiente = prev + 1;
            if (siguiente >= preguntas.length) {
                // Entregar
                handleEntregar();
                return prev;
            }
            // Configurar timer de la siguiente pregunta
            const sigPregunta = preguntas[siguiente];
            setSegundosPregunta(sigPregunta.tiempo_limite_seg ? sigPregunta.tiempo_limite_seg * 60 : null);
            avanzandoRef.current = false;
            return siguiente;
        });
    }, [preguntas, handleEntregar]);

    // Timer por pregunta
    useEffect(() => {
        if (segundosPregunta === null || entregado || entregando || cargando) return;
        if (segundosPregunta <= 0) {
            avanzarPregunta();
            return;
        }
        const timer = setInterval(() => {
            setSegundosPregunta(prev => (prev !== null && prev > 1 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [segundosPregunta, entregado, entregando, cargando]);

    const handleSiguiente = () => {
        avanzandoRef.current = false;
        avanzarPregunta();
    };

    const formatTiempo = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const handleOpcionMultiple = (pregunta_id: string, opcion_id: string, checked: boolean) => {
        setRespuestas(prev => {
            const actuales = prev[pregunta_id]?.opciones_seleccionadas || [];
            const nuevas = checked ? [...actuales, opcion_id] : actuales.filter(id => id !== opcion_id);
            return { ...prev, [pregunta_id]: { opciones_seleccionadas: nuevas } };
        });
    };

    const handleVerdaderoFalso = (pregunta_id: string, opcion_id: string) => {
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

    if (entregado) {
        return (
            <div className="admin-layout">
                <div className="admin-content-wrapper">
                    <NavbarEstudiante />
                    <div className="admin-page-container" style={{ textAlign: 'center', marginTop: '8vh' }}>
                        <div style={{ background: 'white', border: '1px solid #e8e5de', borderRadius: '20px', padding: '4rem', maxWidth: '480px', margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
                            <h2 style={{ fontSize: '1.8rem', color: '#1a1a1a', marginBottom: '0.75rem', fontWeight: 800 }}>Examen Entregado</h2>
                            <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                                Tu examen fue enviado correctamente. Podrás ver tu calificación cuando sea liberada.
                            </p>
                            <button onClick={() => navigate('/estudiante/calificaciones')} className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                                Ver mis calificaciones
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (cargando) {
        return (
            <div className="admin-layout">
                <div className="admin-content-wrapper">
                    <NavbarEstudiante />
                    <div className="admin-page-container">
                        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>Cargando examen...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!preguntaActual) return null;

    const tiempoAgotandose = segundosPregunta !== null && segundosPregunta <= 10;

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarEstudiante />
                <div className="admin-page-container" style={{ maxWidth: '680px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'white', padding: '1.1rem 1.5rem', borderRadius: '12px',
                        border: '1px solid #e8e5de', marginBottom: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: '1rem', zIndex: 10
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1a1a1a', fontWeight: 700 }}>{examen?.titulo}</h2>
                            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
                                Pregunta {indicePregunta + 1} de {preguntas.length}
                            </p>
                        </div>
                        {segundosPregunta !== null && (
                            <span style={{
                                color: tiempoAgotandose ? '#dc2626' : '#16a34a',
                                fontWeight: 700, fontSize: '1.2rem',
                                background: tiempoAgotandose ? '#fef2f2' : '#dcfce7',
                                padding: '0.4rem 0.9rem', borderRadius: '8px',
                                border: `1px solid ${tiempoAgotandose ? '#fecaca' : '#bbf7d0'}`,
                                transition: 'all 0.3s',
                                animation: tiempoAgotandose ? 'pulse 0.8s infinite' : 'none'
                            }}>
                                ⏱ {formatTiempo(segundosPregunta)}
                            </span>
                        )}
                    </div>

                    {/* Barra de progreso */}
                    <div style={{ background: '#e8e5de', borderRadius: '99px', height: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                        <div style={{
                            background: '#16a34a', height: '100%', borderRadius: '99px',
                            width: `${((indicePregunta + 1) / preguntas.length) * 100}%`,
                            transition: 'width 0.4s ease'
                        }} />
                    </div>

                    {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca', textAlign: 'center' }}>{error}</p>}

                    {/* Tarjeta de pregunta */}
                    <div style={{
                        background: 'white', border: '1px solid #e8e5de',
                        borderRadius: '16px', padding: '2rem',
                        borderLeft: '4px solid #16a34a',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#16a34a', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                Pregunta {indicePregunta + 1}
                            </span>
                            <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                                {preguntaActual.puntaje} pts
                            </span>
                        </div>

                        <p style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: '#1a1a1a', lineHeight: 1.6, fontWeight: 500 }}>
                            {preguntaActual.enunciado}
                        </p>

                        {/* Opción múltiple */}
                        {preguntaActual.tipo === 'OPCION_MULTIPLE' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 0.4rem', fontWeight: 500 }}>Selecciona una o más opciones</p>
                                {preguntaActual.opciones.map(opcion => {
                                    const isSelected = (respuestas[preguntaActual.id]?.opciones_seleccionadas || []).includes(opcion.id);
                                    return (
                                        <label key={opcion.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer',
                                            background: isSelected ? '#dcfce7' : '#f7f6f2',
                                            padding: '0.85rem 1rem', borderRadius: '8px',
                                            border: isSelected ? '1px solid #86efac' : '1px solid #e8e5de',
                                            color: isSelected ? '#166534' : '#374151',
                                            fontWeight: isSelected ? 600 : 400, transition: 'all 0.15s ease'
                                        }}>
                                            <input type="checkbox" checked={isSelected}
                                                onChange={e => handleOpcionMultiple(preguntaActual.id, opcion.id, e.target.checked)}
                                                style={{ transform: 'scale(1.2)', accentColor: '#16a34a' }} />
                                            {opcion.texto}
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {/* Verdadero / Falso */}
                        {preguntaActual.tipo === 'VERDADERO_FALSO' && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {preguntaActual.opciones.map(opcion => {
                                    const isSelected = respuestas[preguntaActual.id]?.opciones_seleccionadas?.[0] === opcion.id;
                                    return (
                                        <label key={opcion.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                                            background: isSelected ? '#dcfce7' : '#f7f6f2',
                                            padding: '0.85rem 1.5rem', borderRadius: '8px', flex: 1, justifyContent: 'center',
                                            border: isSelected ? '1px solid #86efac' : '1px solid #e8e5de',
                                            color: isSelected ? '#166534' : '#374151',
                                            fontWeight: isSelected ? 700 : 500, fontSize: '1rem', transition: 'all 0.15s ease'
                                        }}>
                                            <input type="radio" name={preguntaActual.id} checked={isSelected}
                                                onChange={() => handleVerdaderoFalso(preguntaActual.id, opcion.id)}
                                                style={{ accentColor: '#16a34a' }} />
                                            {opcion.texto}
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {/* Abierta */}
                        {preguntaActual.tipo === 'ABIERTA' && (
                            <textarea rows={5} placeholder="Escribe tu respuesta aquí..."
                                value={respuestas[preguntaActual.id]?.texto_respuesta || ''}
                                onChange={e => handleTexto(preguntaActual.id, e.target.value)}
                                style={{
                                    width: '100%', padding: '0.85rem 1rem', fontSize: '0.95rem',
                                    borderRadius: '8px', border: '1px solid #e8e5de', resize: 'vertical',
                                    boxSizing: 'border-box', background: '#f7f6f2', color: '#1a1a1a',
                                    fontFamily: 'inherit', outline: 'none', lineHeight: 1.6
                                }}
                                onFocus={e => e.target.style.borderColor = '#16a34a'}
                                onBlur={e => e.target.style.borderColor = '#e8e5de'}
                            />
                        )}

                        {/* Relacionar */}
                        {preguntaActual.tipo === 'RELACIONAR' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 0.4rem', fontWeight: 500 }}>Relaciona cada elemento con su par correcto</p>
                                {preguntaActual.pares.map((par, i) => (
                                    <div key={par.id} style={{
                                        display: 'flex', gap: '1rem', alignItems: 'center',
                                        background: '#f7f6f2', padding: '0.85rem 1rem',
                                        borderRadius: '8px', border: '1px solid #e8e5de'
                                    }}>
                                        <span style={{ fontSize: '0.95rem', minWidth: '140px', color: '#1a1a1a', fontWeight: 600 }}>{par.lado_izquierdo}</span>
                                        <span style={{ color: '#9ca3af', flexShrink: 0 }}>➜</span>
                                        <select
                                            value={respuestas[preguntaActual.id]?.pares_relacionados?.[i]?.derecho || ''}
                                            onChange={e => handlePar(preguntaActual.id, par.lado_izquierdo, e.target.value, i)}
                                            style={{ padding: '0.55rem 0.9rem', border: '1px solid #e8e5de', borderRadius: '6px', fontSize: '0.95rem', background: 'white', color: '#1a1a1a', flex: 1, outline: 'none' }}>
                                            <option value="">Seleccionar...</option>
                                            {(derechosMezclados[preguntaActual.id] || preguntaActual.pares.map(p => p.lado_derecho)).map((derecho, idx) => (
                                                <option key={idx} value={derecho}>{derecho}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Completar */}
                        {preguntaActual.tipo === 'COMPLETAR' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {preguntaActual.espacios.map((esp, i) => (
                                    <div key={esp.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        background: '#f7f6f2', padding: '0.85rem 1rem',
                                        borderRadius: '8px', border: '1px solid #e8e5de'
                                    }}>
                                        <span style={{ fontSize: '0.9rem', color: '#6b7280', minWidth: '90px', fontWeight: 600 }}>Espacio {esp.numero_espacio}:</span>
                                        <input
                                            placeholder="Escribe la palabra o frase"
                                            value={respuestas[preguntaActual.id]?.espacios_respuestas?.[i] || ''}
                                            onChange={e => handleEspacio(preguntaActual.id, e.target.value, i)}
                                            style={{ padding: '0.55rem 0.9rem', border: '1px solid #e8e5de', borderRadius: '6px', fontSize: '0.95rem', background: 'white', color: '#1a1a1a', flex: 1, outline: 'none' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botón siguiente / entregar */}
                    <button
                        onClick={handleSiguiente}
                        disabled={entregando}
                        className="btn-primary"
                        style={{
                            marginBottom: '3rem', padding: '1rem',
                            fontSize: '1rem', width: '100%', fontWeight: 700,
                            letterSpacing: '0.5px', borderRadius: '10px',
                            opacity: entregando ? 0.6 : 1
                        }}>
                        {entregando ? 'Entregando...' : esUltimaPregunta ? 'Finalizar y Entregar Examen' : 'Siguiente pregunta →'}
                    </button>

                    <style>{`
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default ResponderExamenPage;
