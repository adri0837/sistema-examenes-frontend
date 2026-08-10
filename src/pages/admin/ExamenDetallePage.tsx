import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api, { obtenerMensajeError } from '../../api/axios';
import type { TipoPregunta } from '../../types';
import './Admin.css';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface Opcion { id?: string; texto: string; es_correcta: boolean; }
interface Par { id?: string; lado_izquierdo: string; lado_derecho: string; }
interface Espacio { id?: string; respuesta_correcta: string; }
interface Pregunta {
    id: string; orden: number; enunciado: string; tipo: TipoPregunta; puntaje: number;
    tiempo_limite_seg: number | null;
    opciones: Opcion[]; pares: Par[]; espacios: Espacio[];
}

const etiquetaTipo: Record<TipoPregunta, string> = {
    OPCION_MULTIPLE: 'Opción múltiple',
    VERDADERO_FALSO: 'Verdadero / Falso',
    ABIERTA: 'Respuesta abierta',
    RELACIONAR: 'Relacionar columnas',
    COMPLETAR: 'Completar espacios',
};

const ExamenDetallePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [intentos, setIntentos] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [reseteando, setReseteando] = useState(false);
    const [error, setError] = useState('');
    const [dialog, setDialog] = useState<{ mensaje: string; onConfirmar: () => void } | null>(null);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [enunciado, setEnunciado] = useState('');
    const [tipo, setTipo] = useState<TipoPregunta>('OPCION_MULTIPLE');
    const [puntaje, setPuntaje] = useState('');
    const [tiempoLimiteSeg, setTiempoLimiteSeg] = useState('');
    const [opciones, setOpciones] = useState<Opcion[]>([{ texto: '', es_correcta: false }, { texto: '', es_correcta: false }]);
    const [pares, setPares] = useState<Par[]>([{ lado_izquierdo: '', lado_derecho: '' }]);
    const [espacios, setEspacios] = useState<Espacio[]>([{ respuesta_correcta: '' }]);

    const cargarPreguntas = async () => {
        if (!id) return;
        try {
            const { data } = await api.get(`/examenes/${id}/preguntas`);
            setPreguntas(data.preguntas ?? data);
            setIntentos(data.intentos ?? 0);
        } catch {
            setError('Error al cargar preguntas');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarPreguntas(); }, [id]);

    const limpiarForm = () => {
        setEditandoId(null); setEnunciado(''); setTipo('OPCION_MULTIPLE'); setPuntaje(''); setTiempoLimiteSeg('');
        setOpciones([{ texto: '', es_correcta: false }, { texto: '', es_correcta: false }]);
        setPares([{ lado_izquierdo: '', lado_derecho: '' }]);
        setEspacios([{ respuesta_correcta: '' }]);
        setMostrarForm(false); setError('');
    };

    const validarForm = (): string | null => {
        if (!enunciado.trim()) return 'El enunciado es requerido';
        if (!puntaje || Number(puntaje) <= 0) return 'El puntaje debe ser mayor a 0';
        if (tipo === 'OPCION_MULTIPLE') {
            if (opciones.some(o => !o.texto.trim())) return 'Todas las opciones deben tener texto';
            if (!opciones.some(o => o.es_correcta)) return 'Marca al menos una opción como correcta';
        }
        if (tipo === 'VERDADERO_FALSO' && !opciones.some(o => o.es_correcta)) return 'Marca la respuesta correcta';
        if (tipo === 'RELACIONAR' && pares.some(p => !p.lado_izquierdo.trim() || !p.lado_derecho.trim())) return 'Todos los pares deben estar completos';
        if (tipo === 'COMPLETAR' && espacios.some(e => !e.respuesta_correcta.trim())) return 'Completa todas las respuestas';
        return null;
    };

    const handleCrear = async () => {
        if (intentos > 0) { setError('No se puede agregar preguntas a un examen con intentos. Primero resetea los intentos.'); return; }
        const v = validarForm(); if (v) { setError(v); return; }
        try {
            setError('');
            await api.post(`/examenes/${id}/preguntas`, {
                enunciado, tipo, puntaje: Number(puntaje),
                tiempo_limite_seg: tiempoLimiteSeg ? Number(tiempoLimiteSeg) : undefined,
                opciones: (tipo === 'OPCION_MULTIPLE' || tipo === 'VERDADERO_FALSO') ? opciones : undefined,
                pares: tipo === 'RELACIONAR' ? pares : undefined,
                espacios: tipo === 'COMPLETAR' ? espacios : undefined,
            });
            limpiarForm(); cargarPreguntas();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al crear pregunta'));
        }
    };

    const handleEditar = async () => {
        if (intentos > 0) { setError('No se puede editar preguntas de un examen con intentos. Primero resetea los intentos.'); return; }
        const v = validarForm(); if (v) { setError(v); return; }
        try {
            setError('');
            await api.put(`/preguntas/${editandoId}`, {
                enunciado, puntaje: Number(puntaje),
                tiempo_limite_seg: tiempoLimiteSeg ? Number(tiempoLimiteSeg) : undefined,
                opciones: (tipo === 'OPCION_MULTIPLE' || tipo === 'VERDADERO_FALSO') ? opciones : undefined,
                pares: tipo === 'RELACIONAR' ? pares : undefined,
                espacios: tipo === 'COMPLETAR' ? espacios : undefined,
            });
            limpiarForm(); cargarPreguntas();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al editar pregunta'));
        }
    };

    const iniciarEdicion = (p: Pregunta) => {
        setEditandoId(p.id); setEnunciado(p.enunciado); setTipo(p.tipo); setPuntaje(String(p.puntaje));
        setTiempoLimiteSeg(p.tiempo_limite_seg ? String(p.tiempo_limite_seg) : '');
        setOpciones(p.opciones.length > 0 ? p.opciones : [{ texto: '', es_correcta: false }]);
        setPares(p.pares.length > 0 ? p.pares : [{ lado_izquierdo: '', lado_derecho: '' }]);
        setEspacios(p.espacios.length > 0 ? p.espacios : [{ respuesta_correcta: '' }]);
        setMostrarForm(false); setError('');
    };

    const handleResetearIntentos = () => {
        setDialog({
            mensaje: `¿Eliminar todos los ${intentos} intento(s) de este examen? Los estudiantes podrán volver a rendirlo. Esta acción no se puede deshacer.`,
            onConfirmar: async () => {
                setDialog(null);
                setReseteando(true);
                try {
                    setError('');
                    await api.delete(`/examenes/${id}/intentos`);
                    setIntentos(0);
                } catch (e) {
                    setError(obtenerMensajeError(e, 'Error al resetear intentos'));
                } finally {
                    setReseteando(false);
                }
            }
        });
    };

    const handleEliminar = (pregunta_id: string) => {
        if (intentos > 0) {
            setError('No se puede eliminar preguntas de un examen con intentos. Primero resetea los intentos.');
            return;
        }
        setDialog({
            mensaje: '¿Eliminar esta pregunta? Esta acción no se puede deshacer.',
            onConfirmar: async () => {
                setDialog(null);
                try {
                    setError('');
                    await api.delete(`/preguntas/${pregunta_id}`);
                    cargarPreguntas();
                } catch (e) {
                    setError(obtenerMensajeError(e, 'Error al eliminar pregunta'));
                }
            }
        });
    };

    const handleCambioTipo = (nuevoTipo: TipoPregunta) => {
        setTipo(nuevoTipo);
        if (nuevoTipo === 'VERDADERO_FALSO') {
            setOpciones([{ texto: 'Verdadero', es_correcta: false }, { texto: 'Falso', es_correcta: false }]);
        } else if (nuevoTipo === 'OPCION_MULTIPLE') {
            setOpciones([{ texto: '', es_correcta: false }, { texto: '', es_correcta: false }]);
        } else {
            setOpciones([]);
        }
        setPares([{ lado_izquierdo: '', lado_derecho: '' }]);
        setEspacios([{ respuesta_correcta: '' }]);
    };

    const renderCamposExtra = () => {
        if (tipo === 'OPCION_MULTIPLE') return (
            <div className="admin-form-group">
                <label>Opciones (marca una o más como correctas)</label>
                {opciones.map((op, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input value={op.texto} placeholder={`Opción ${i + 1}`} onChange={e => {
                            const n = [...opciones]; n[i].texto = e.target.value; setOpciones(n);
                        }} style={{ flex: 1 }} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap', color: '#6b7280', cursor: 'pointer' }}>
                            <input type="checkbox" checked={op.es_correcta} onChange={e => {
                                const n = [...opciones]; n[i].es_correcta = e.target.checked; setOpciones(n);
                            }} style={{ accentColor: '#16a34a' }} /> Correcta
                        </label>
                        {opciones.length > 2 && (
                            <button type="button" onClick={() => setOpciones(opciones.filter((_, idx) => idx !== i))}
                                className="action-btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '12px' }}>✕</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={() => setOpciones([...opciones, { texto: '', es_correcta: false }])}
                    className="action-btn" style={{ fontSize: '12px', marginTop: '0.25rem' }}>+ Opción</button>
            </div>
        );

        if (tipo === 'VERDADERO_FALSO') return (
            <div className="admin-form-group">
                <label>Respuesta correcta</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {opciones.map((op, i) => (
                        <label key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                            padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 500,
                            border: `2px solid ${op.es_correcta ? '#86efac' : '#e8e5de'}`,
                            background: op.es_correcta ? '#dcfce7' : '#f7f6f2',
                            color: op.es_correcta ? '#166534' : '#6b7280',
                            transition: 'all 0.15s ease'
                        }}>
                            <input type="radio" name="vf_correcta" checked={op.es_correcta}
                                onChange={() => setOpciones(opciones.map((o, idx) => ({ ...o, es_correcta: idx === i })))}
                                style={{ accentColor: '#16a34a' }} />
                            {op.texto}
                        </label>
                    ))}
                </div>
            </div>
        );

        if (tipo === 'RELACIONAR') return (
            <div className="admin-form-group">
                <label>Pares (Izquierdo → Derecho correcto)</label>
                {pares.map((par, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <input value={par.lado_izquierdo} placeholder={`Elemento ${i + 1}`} onChange={e => {
                            const n = [...pares]; n[i].lado_izquierdo = e.target.value; setPares(n);
                        }} style={{ flex: 1 }} />
                        <span style={{ color: '#9ca3af', flexShrink: 0 }}>→</span>
                        <input value={par.lado_derecho} placeholder="Par correcto" onChange={e => {
                            const n = [...pares]; n[i].lado_derecho = e.target.value; setPares(n);
                        }} style={{ flex: 1 }} />
                        {pares.length > 1 && (
                            <button type="button" onClick={() => setPares(pares.filter((_, idx) => idx !== i))}
                                className="action-btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '12px' }}>✕</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={() => setPares([...pares, { lado_izquierdo: '', lado_derecho: '' }])}
                    className="action-btn" style={{ fontSize: '12px', marginTop: '0.25rem' }}>+ Par</button>
            </div>
        );

        if (tipo === 'COMPLETAR') return (
            <div className="admin-form-group">
                <label>Respuestas correctas por espacio</label>
                {espacios.map((esp, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', minWidth: '80px', fontWeight: 500 }}>Espacio {i + 1}:</span>
                        <input value={esp.respuesta_correcta} placeholder="Respuesta correcta" onChange={e => {
                            const n = [...espacios]; n[i].respuesta_correcta = e.target.value; setEspacios(n);
                        }} style={{ flex: 1 }} />
                        {espacios.length > 1 && (
                            <button type="button" onClick={() => setEspacios(espacios.filter((_, idx) => idx !== i))}
                                className="action-btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '12px' }}>✕</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={() => setEspacios([...espacios, { respuesta_correcta: '' }])}
                    className="action-btn" style={{ fontSize: '12px', marginTop: '0.25rem' }}>+ Espacio</button>
            </div>
        );

        return null;
    };

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => navigate('/admin/examenes')} className="action-btn">
                                ← Volver
                            </button>
                            <h2>Preguntas del examen</h2>
                        </div>
                        {!editandoId && (
                            <button onClick={() => {
                                if (intentos > 0) { setError('No se puede agregar preguntas a un examen con intentos. Primero resetea los intentos.'); return; }
                                setMostrarForm(!mostrarForm); setError('');
                            }}
                                className="btn-primary"
                                style={{ opacity: intentos > 0 ? 0.5 : 1, cursor: intentos > 0 ? 'not-allowed' : 'pointer' }}>
                                {mostrarForm ? 'Cancelar' : '+ Nueva pregunta'}
                            </button>
                        )}
                    </div>

                    {error && (
                        <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                            {error}
                        </p>
                    )}

                    {intentos > 0 && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>⚠️ Este examen tiene {intentos} intento(s) de estudiantes.</span>
                                <p style={{ margin: '4px 0 0', color: '#a16207', fontSize: '0.82rem' }}>
                                    Para agregar, editar o eliminar preguntas, primero debes resetear los intentos.
                                </p>
                            </div>
                            <button onClick={handleResetearIntentos} disabled={reseteando}
                                className="action-btn btn-danger"
                                style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                {reseteando ? 'Reseteando...' : `Resetear ${intentos} intento(s)`}
                            </button>
                        </div>
                    )}

                    {(mostrarForm || editandoId) && (
                        <div className="admin-form-card" style={{ borderColor: editandoId ? '#fde68a' : undefined }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="admin-form-group" style={{ margin: 0 }}>
                                    <label>Enunciado</label>
                                    <input value={enunciado} onChange={e => setEnunciado(e.target.value)} placeholder="Escribe la pregunta..." />
                                </div>
                                <div className="admin-form-group" style={{ margin: 0 }}>
                                    <label>Tipo</label>
                                    <select value={tipo} onChange={e => handleCambioTipo(e.target.value as TipoPregunta)} disabled={!!editandoId}>
                                        {Object.entries(etiquetaTipo).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                                    </select>
                                    {editandoId && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>No se puede cambiar</p>}
                                </div>
                                <div className="admin-form-group" style={{ margin: 0 }}>
                                    <label>Puntaje</label>
                                    <input type="number" min="1" value={puntaje} onChange={e => setPuntaje(e.target.value)} style={{ width: '90px' }} />
                                </div>
                                <div className="admin-form-group" style={{ margin: 0 }}>
                                    <label>Tiempo límite (min)</label>
                                    <input type="number" min="5" placeholder="Sin límite" value={tiempoLimiteSeg} onChange={e => setTiempoLimiteSeg(e.target.value)} style={{ width: '120px' }} />
                                </div>
                            </div>
                            {renderCamposExtra()}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                <button onClick={editandoId ? handleEditar : handleCrear} className="btn-primary">
                                    {editandoId ? 'Guardar cambios' : 'Agregar pregunta'}
                                </button>
                                <button onClick={limpiarForm} className="action-btn">Cancelar</button>
                            </div>
                        </div>
                    )}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando preguntas...</p> : (
                        <div className="admin-table-container">
                            {preguntas.length > 0 && (() => {
                                const totalMin = preguntas.reduce((sum, p) => sum + (p.tiempo_limite_seg || 0), 0);
                                const conTiempo = preguntas.filter(p => p.tiempo_limite_seg).length;
                                return totalMin > 0 ? (
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '0.75rem', fontSize: '0.88rem', color: '#166534', display: 'flex', gap: '1.5rem' }}>
                                        <span>⏱ <strong>Tiempo total del examen:</strong> {totalMin} min</span>
                                        <span style={{ color: '#6b7280' }}>{conTiempo} de {preguntas.length} preguntas con tiempo asignado</span>
                                    </div>
                                ) : null;
                            })()}
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Enunciado</th>
                                        <th>Tipo</th>
                                        <th>Puntaje</th>
                                        <th>Tiempo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preguntas.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>
                                                No hay preguntas registradas
                                            </td>
                                        </tr>
                                    ) : (
                                        preguntas.map(p => (
                                            <tr key={p.id} style={{ background: editandoId === p.id ? '#fffbeb' : undefined }}>
                                                <td style={{ color: '#6b7280' }}>{p.orden}</td>
                                                <td style={{ fontWeight: 500 }}>{p.enunciado}</td>
                                                <td>
                                                    <span className="badge badge-info">{etiquetaTipo[p.tipo]}</span>
                                                </td>
                                                <td style={{ color: '#6b7280' }}>{p.puntaje} pts</td>
                                                <td style={{ color: '#6b7280' }}>{p.tiempo_limite_seg ? `${p.tiempo_limite_seg} min` : '—'}</td>
                                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => {
                                                        if (intentos > 0) { setError('No se puede editar preguntas de un examen con intentos. Primero resetea los intentos.'); return; }
                                                        iniciarEdicion(p);
                                                    }}
                                                        className="action-btn"
                                                        style={{ opacity: intentos > 0 ? 0.4 : 1, cursor: intentos > 0 ? 'not-allowed' : 'pointer' }}>
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleEliminar(p.id)}
                                                        className="action-btn btn-danger"
                                                        style={{ opacity: intentos > 0 ? 0.4 : 1, cursor: intentos > 0 ? 'not-allowed' : 'pointer' }}>
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            {dialog && (
                <ConfirmDialog
                    mensaje={dialog.mensaje}
                    onConfirmar={dialog.onConfirmar}
                    onCancelar={() => setDialog(null)}
                />
            )}
        </div>
    );
};

export default ExamenDetallePage;