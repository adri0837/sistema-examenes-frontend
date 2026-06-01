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
    opciones: Opcion[]; pares: Par[]; espacios: Espacio[];
}
interface Examen { id: string; titulo: string; tiempo_limite_min: number | null; }

// Mezclar array — Fisher-Yates
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
    const [entregado, setEntregado] = useState(false);
    const [entregando, setEntregando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [segundos, setSegundos] = useState<number | null>(null);
    const entregandoRef = useRef(false);

    // Lados derechos mezclados por pregunta — se generan una sola vez al cargar
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
                if (data.examen.tiempo_limite_min) {
                    setSegundos(data.examen.tiempo_limite_min * 60);
                }
                if (data.examen?.id) {
                    localStorage.setItem(`intento_${data.examen.id}`, data.intento.id);
                }
            } catch {
                setError('Error al cargar el examen. Puede que ya haya sido entregado.');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [intento_id]);

    useEffect(() => {
        if (segundos === null || segundos <= 0 || entregado || entregando || cargando) return;
        const timer = setInterval(() => {
            setSegundos(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [cargando, entregado, entregando]);

    const handleEntregar = useCallback(async (forzar = false) => {
        if (entregandoRef.current || entregado) return;

        if (!forzar) {
            const sinResponder = preguntas.filter(p => {
                const r = respuestas[p.id];
                if (!r) return true;
                if (p.tipo === 'ABIERTA') return !r.texto_respuesta?.trim();
                if (p.tipo === 'OPCION_MULTIPLE' || p.tipo === 'VERDADERO_FALSO') return !r.opciones_seleccionadas?.length;
                if (p.tipo === 'RELACIONAR') return !r.pares_relacionados?.length || r.pares_relacionados.some(p => !p.derecho);
                if (p.tipo === 'COMPLETAR') return !r.espacios_respuestas?.length || r.espacios_respuestas.some(e => !e?.trim());
                return true;
            });

            if (sinResponder.length > 0) {
                const confirmar = window.confirm(`Tienes ${sinResponder.length} pregunta(s) sin responder. ¿Deseas entregar de todas formas?`);
                if (!confirmar) return;
            } else {
                const confirmar = window.confirm('¿Estás seguro de que deseas entregar el examen? No podrás modificar tus respuestas.');
                if (!confirmar) return;
            }
        }

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

    useEffect(() => {
        if (segundos === 0 && !entregado && !entregando && !cargando && preguntas.length > 0) {
            handleEntregar(true);
        }
    }, [segundos, entregado, entregando, cargando, preguntas.length, handleEntregar]);

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

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarEstudiante />
                <div className="admin-page-container" style={{ maxWidth: '780px', margin: '0 auto' }}>

                    {/* Header sticky */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'white', padding: '1.1rem 1.5rem', borderRadius: '12px',
                        border: '1px solid #e8e5de', marginBottom: '2rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: '1rem', zIndex: 10
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1a1a1a', fontWeight: 700 }}>{examen?.titulo}</h2>
                        {segundos !== null && (
                            <span style={{
                                color: segundos < 60 ? '#dc2626' : '#16a34a',
                                fontWeight: 700, fontSize: '1.1rem',
                                background: segundos < 60 ? '#fef2f2' : '#dcfce7',
                                padding: '0.4rem 0.9rem', borderRadius: '8px',
                                border: `1px solid ${segundos < 60 ? '#fecaca' : '#bbf7d0'}`
                            }}>
                                ⏱ {formatTiempo(segundos)}
                            </span>
                        )}
                    </div>

                    {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca', textAlign: 'center' }}>{error}</p>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {preguntas.map((pregunta, index) => (
                            <div key={pregunta.id} style={{
                                background: 'white', border: '1px solid #e8e5de',
                                borderRadius: '12px', padding: '1.75rem',
                                borderLeft: '4px solid #16a34a',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#16a34a', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Pregunta {index + 1}
                                    </span>
                                    <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                                        {pregunta.puntaje} pts
                                    </span>
                                </div>

                                <p style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', color: '#1a1a1a', lineHeight: 1.6, fontWeight: 500 }}>
                                    {pregunta.enunciado}
                                </p>

                                {/* Opción múltiple */}
                                {pregunta.tipo === 'OPCION_MULTIPLE' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 0.4rem', fontWeight: 500 }}>Selecciona una o más opciones</p>
                                        {pregunta.opciones.map(opcion => {
                                            const isSelected = (respuestas[pregunta.id]?.opciones_seleccionadas || []).includes(opcion.id);
                                            return (
                                                <label key={opcion.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer',
                                                    background: isSelected ? '#dcfce7' : '#f7f6f2',
                                                    padding: '0.85rem 1rem', borderRadius: '8px',
                                                    border: isSelected ? '1px solid #86efac' : '1px solid #e8e5de',
                                                    color: isSelected ? '#166534' : '#374151',
                                                    fontWeight: isSelected ? 600 : 400,
                                                    transition: 'all 0.15s ease'
                                                }}>
                                                    <input type="checkbox" checked={isSelected}
                                                        onChange={e => handleOpcionMultiple(pregunta.id, opcion.id, e.target.checked)}
                                                        style={{ transform: 'scale(1.2)', accentColor: '#16a34a' }} />
                                                    {opcion.texto}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Verdadero / Falso */}
                                {pregunta.tipo === 'VERDADERO_FALSO' && (
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {pregunta.opciones.map(opcion => {
                                            const isSelected = respuestas[pregunta.id]?.opciones_seleccionadas?.[0] === opcion.id;
                                            return (
                                                <label key={opcion.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                                                    background: isSelected ? '#dcfce7' : '#f7f6f2',
                                                    padding: '0.85rem 1.5rem', borderRadius: '8px', flex: 1, justifyContent: 'center',
                                                    border: isSelected ? '1px solid #86efac' : '1px solid #e8e5de',
                                                    color: isSelected ? '#166534' : '#374151',
                                                    fontWeight: isSelected ? 700 : 500,
                                                    fontSize: '1rem', transition: 'all 0.15s ease'
                                                }}>
                                                    <input type="radio" name={pregunta.id} checked={isSelected}
                                                        onChange={() => handleVerdaderoFalso(pregunta.id, opcion.id)}
                                                        style={{ accentColor: '#16a34a' }} />
                                                    {opcion.texto}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Abierta */}
                                {pregunta.tipo === 'ABIERTA' && (
                                    <textarea rows={5} placeholder="Escribe tu respuesta aquí..."
                                        value={respuestas[pregunta.id]?.texto_respuesta || ''}
                                        onChange={e => handleTexto(pregunta.id, e.target.value)}
                                        style={{
                                            width: '100%', padding: '0.85rem 1rem', fontSize: '0.95rem',
                                            borderRadius: '8px', border: '1px solid #e8e5de', resize: 'vertical',
                                            boxSizing: 'border-box', background: '#f7f6f2', color: '#1a1a1a',
                                            fontFamily: 'inherit', outline: 'none', lineHeight: 1.6,
                                            transition: 'border-color 0.15s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#16a34a'}
                                        onBlur={e => e.target.style.borderColor = '#e8e5de'}
                                    />
                                )}

                                {/* Relacionar columnas — lados derechos mezclados */}
                                {pregunta.tipo === 'RELACIONAR' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 0.4rem', fontWeight: 500 }}>Relaciona cada elemento con su par correcto</p>
                                        {pregunta.pares.map((par, i) => (
                                            <div key={par.id} style={{
                                                display: 'flex', gap: '1rem', alignItems: 'center',
                                                background: '#f7f6f2', padding: '0.85rem 1rem',
                                                borderRadius: '8px', border: '1px solid #e8e5de'
                                            }}>
                                                <span style={{ fontSize: '0.95rem', minWidth: '140px', color: '#1a1a1a', fontWeight: 600 }}>
                                                    {par.lado_izquierdo}
                                                </span>
                                                <span style={{ color: '#9ca3af', flexShrink: 0 }}>➜</span>
                                                <select
                                                    value={respuestas[pregunta.id]?.pares_relacionados?.[i]?.derecho || ''}
                                                    onChange={e => handlePar(pregunta.id, par.lado_izquierdo, e.target.value, i)}
                                                    style={{
                                                        padding: '0.55rem 0.9rem', border: '1px solid #e8e5de',
                                                        borderRadius: '6px', fontSize: '0.95rem',
                                                        background: 'white', color: '#1a1a1a', flex: 1, outline: 'none'
                                                    }}>
                                                    <option value="">Seleccionar...</option>
                                                    {(derechosMezclados[pregunta.id] || pregunta.pares.map(p => p.lado_derecho)).map((derecho, idx) => (
                                                        <option key={idx} value={derecho}>{derecho}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Completar espacios */}
                                {pregunta.tipo === 'COMPLETAR' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {pregunta.espacios.map((esp, i) => (
                                            <div key={esp.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                background: '#f7f6f2', padding: '0.85rem 1rem',
                                                borderRadius: '8px', border: '1px solid #e8e5de'
                                            }}>
                                                <span style={{ fontSize: '0.9rem', color: '#6b7280', minWidth: '90px', fontWeight: 600 }}>
                                                    Espacio {esp.numero_espacio}:
                                                </span>
                                                <input
                                                    placeholder="Escribe la palabra o frase"
                                                    value={respuestas[pregunta.id]?.espacios_respuestas?.[i] || ''}
                                                    onChange={e => handleEspacio(pregunta.id, e.target.value, i)}
                                                    style={{
                                                        padding: '0.55rem 0.9rem', border: '1px solid #e8e5de',
                                                        borderRadius: '6px', fontSize: '0.95rem',
                                                        background: 'white', color: '#1a1a1a', flex: 1, outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => handleEntregar()}
                        disabled={entregando}
                        className="btn-primary"
                        style={{
                            marginTop: '2.5rem', marginBottom: '3rem', padding: '1rem',
                            fontSize: '1rem', width: '100%', fontWeight: 700,
                            letterSpacing: '0.5px', borderRadius: '10px',
                            opacity: entregando ? 0.6 : 1
                        }}>
                        {entregando ? 'Entregando...' : 'Finalizar y Entregar Examen'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResponderExamenPage;