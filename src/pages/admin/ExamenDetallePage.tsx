import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';
import type { TipoPregunta } from '../../types';
import './Admin.css';

interface Opcion { id?: string; texto: string; es_correcta: boolean; }
interface Par { id?: string; lado_izquierdo: string; lado_derecho: string; }
interface Espacio { id?: string; respuesta_correcta: string; }
interface Pregunta {
    id: string; orden: number; enunciado: string; tipo: TipoPregunta; puntaje: number;
    opciones: Opcion[]; pares: Par[]; espacios: Espacio[];
}

const etiquetaTipo: Record<TipoPregunta, string> = {
    OPCION_MULTIPLE: 'Opción múltiple',
    VERDADERO_FALSO: 'Verdadero / Falso',
    ABIERTA: 'Respuesta abierta',
    RELACIONAR: 'Relacionar columnas',
    COMPLETAR: 'Completar espacios',
};

const formInicial = {
    enunciado: '',
    tipo: 'OPCION_MULTIPLE' as TipoPregunta,
    puntaje: '',
    opciones: [{ texto: '', es_correcta: false }, { texto: '', es_correcta: false }] as Opcion[],
    pares: [{ lado_izquierdo: '', lado_derecho: '' }] as Par[],
    espacios: [{ respuesta_correcta: '' }] as Espacio[],
};

const ExamenDetallePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [enunciado, setEnunciado] = useState(formInicial.enunciado);
    const [tipo, setTipo] = useState<TipoPregunta>(formInicial.tipo);
    const [puntaje, setPuntaje] = useState(formInicial.puntaje);
    const [opciones, setOpciones] = useState<Opcion[]>(formInicial.opciones);
    const [pares, setPares] = useState<Par[]>(formInicial.pares);
    const [espacios, setEspacios] = useState<Espacio[]>(formInicial.espacios);

    const cargarPreguntas = async () => {
        if (!id) return;
        try {
            const { data } = await api.get(`/examenes/${id}/preguntas`);
            setPreguntas(data);
        } catch {
            setError('Error al cargar preguntas');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarPreguntas(); }, [id]);

    const limpiarForm = () => {
        setEditandoId(null);
        setEnunciado('');
        setTipo('OPCION_MULTIPLE');
        setPuntaje('');
        setOpciones([{ texto: '', es_correcta: false }, { texto: '', es_correcta: false }]);
        setPares([{ lado_izquierdo: '', lado_derecho: '' }]);
        setEspacios([{ respuesta_correcta: '' }]);
        setMostrarForm(false);
        setError('');
    };

    const validarForm = (): string | null => {
        if (!enunciado.trim()) return 'El enunciado es requerido';
        if (!puntaje || Number(puntaje) <= 0) return 'El puntaje debe ser mayor a 0';
        if (tipo === 'OPCION_MULTIPLE') {
            if (opciones.some(o => !o.texto.trim())) return 'Todas las opciones deben tener texto';
            if (!opciones.some(o => o.es_correcta)) return 'Marca al menos una opción como correcta';
        }
        if (tipo === 'VERDADERO_FALSO' && !opciones.some(o => o.es_correcta)) {
            return 'Marca la respuesta correcta (Verdadero o Falso)';
        }
        if (tipo === 'RELACIONAR' && pares.some(p => !p.lado_izquierdo.trim() || !p.lado_derecho.trim())) {
            return 'Todos los pares deben estar completos';
        }
        if (tipo === 'COMPLETAR' && espacios.some(e => !e.respuesta_correcta.trim())) {
            return 'Completa todas las respuestas de los espacios';
        }
        return null;
    };

    const handleCrear = async () => {
        const validacion = validarForm();
        if (validacion) { setError(validacion); return; }
        try {
            setError('');
            await api.post(`/examenes/${id}/preguntas`, {
                enunciado, tipo, puntaje: Number(puntaje),
                opciones: (tipo === 'OPCION_MULTIPLE' || tipo === 'VERDADERO_FALSO') ? opciones : undefined,
                pares: tipo === 'RELACIONAR' ? pares : undefined,
                espacios: tipo === 'COMPLETAR' ? espacios : undefined,
            });
            limpiarForm();
            cargarPreguntas();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Error al crear pregunta');
        }
    };

    const handleEditar = async () => {
        const validacion = validarForm();
        if (validacion) { setError(validacion); return; }
        try {
            setError('');
            await api.put(`/preguntas/${editandoId}`, {
                enunciado, puntaje: Number(puntaje),
                opciones: (tipo === 'OPCION_MULTIPLE' || tipo === 'VERDADERO_FALSO') ? opciones : undefined,
                pares: tipo === 'RELACIONAR' ? pares : undefined,
                espacios: tipo === 'COMPLETAR' ? espacios : undefined,
            });
            limpiarForm();
            cargarPreguntas();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Error al editar pregunta');
        }
    };

    const iniciarEdicion = (p: Pregunta) => {
        setEditandoId(p.id);
        setEnunciado(p.enunciado);
        setTipo(p.tipo);
        setPuntaje(String(p.puntaje));
        setOpciones(p.opciones.length > 0 ? p.opciones : [{ texto: '', es_correcta: false }]);
        setPares(p.pares.length > 0 ? p.pares : [{ lado_izquierdo: '', lado_derecho: '' }]);
        setEspacios(p.espacios.length > 0 ? p.espacios : [{ respuesta_correcta: '' }]);
        setMostrarForm(false);
        setError('');
    };

    const handleEliminar = async (pregunta_id: string) => {
        if (!window.confirm('¿Eliminar esta pregunta?')) return;
        try {
            setError('');
            await api.delete(`/preguntas/${pregunta_id}`);
            cargarPreguntas();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Error al eliminar pregunta');
        }
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
        if (tipo === 'OPCION_MULTIPLE') {
            return (
                <div className="admin-form-group">
                    <label>Opciones (marca una o más como correctas)</label>
                    {opciones.map((op, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input value={op.texto} placeholder={`Opción ${i + 1}`} onChange={e => {
                                const nuevas = [...opciones]; nuevas[i].texto = e.target.value; setOpciones(nuevas);
                            }} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={op.es_correcta} onChange={e => {
                                    const nuevas = [...opciones]; nuevas[i].es_correcta = e.target.checked; setOpciones(nuevas);
                                }} /> Correcta
                            </label>
                            {opciones.length > 2 && (
                                <button type="button" onClick={() => setOpciones(opciones.filter((_, idx) => idx !== i))} className="action-btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '12px' }}>✕</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => setOpciones([...opciones, { texto: '', es_correcta: false }])} className="action-btn" style={{ fontSize: '12px', padding: '0.3rem 0.8rem', marginTop: '0.25rem' }}>+ Opción</button>
                </div>
            );
        }

        if (tipo === 'VERDADERO_FALSO') {
            return (
                <div className="admin-form-group">
                    <label>Respuesta correcta</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {opciones.map((op, i) => (
                            <label key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem',
                                border: `2px solid ${op.es_correcta ? 'rgba(74, 222, 128, 0.5)' : 'rgba(255,255,255,0.15)'}`,
                                borderRadius: '8px', background: op.es_correcta ? 'rgba(74, 222, 128, 0.1)' : 'transparent'
                            }}>
                                <input type="radio" name="vf_correcta" checked={op.es_correcta}
                                    onChange={() => setOpciones(opciones.map((o, idx) => ({ ...o, es_correcta: idx === i })))} />
                                {op.texto}
                            </label>
                        ))}
                    </div>
                </div>
            );
        }

        if (tipo === 'RELACIONAR') {
            return (
                <div className="admin-form-group">
                    <label>Pares (Izquierdo → Derecho)</label>
                    {pares.map((par, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <input value={par.lado_izquierdo} placeholder={`Elemento ${i + 1}`} onChange={e => {
                                const nuevos = [...pares]; nuevos[i].lado_izquierdo = e.target.value; setPares(nuevos);
                            }} style={{ flex: 1 }} />
                            <span style={{ color: '#64748b' }}>→</span>
                            <input value={par.lado_derecho} placeholder="Par correcto" onChange={e => {
                                const nuevos = [...pares]; nuevos[i].lado_derecho = e.target.value; setPares(nuevos);
                            }} style={{ flex: 1 }} />
                            {pares.length > 1 && (
                                <button type="button" onClick={() => setPares(pares.filter((_, idx) => idx !== i))} className="action-btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '12px' }}>✕</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => setPares([...pares, { lado_izquierdo: '', lado_derecho: '' }])} className="action-btn" style={{ fontSize: '12px', padding: '0.3rem 0.8rem' }}>+ Par</button>
                </div>
            );
        }

        if (tipo === 'COMPLETAR') {
            return (
                <div className="admin-form-group">
                    <label>Respuestas correctas por espacio</label>
                    {espacios.map((esp, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: '#94a3b8', minWidth: '80px' }}>Espacio {i + 1}:</span>
                            <input value={esp.respuesta_correcta} placeholder="Respuesta correcta" onChange={e => {
                                const nuevos = [...espacios]; nuevos[i].respuesta_correcta = e.target.value; setEspacios(nuevos);
                            }} style={{ flex: 1 }} />
                            {espacios.length > 1 && (
                                <button type="button" onClick={() => setEspacios(espacios.filter((_, idx) => idx !== i))} className="action-btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '12px' }}>✕</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={() => setEspacios([...espacios, { respuesta_correcta: '' }])} className="action-btn" style={{ fontSize: '12px', padding: '0.3rem 0.8rem' }}>+ Espacio</button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => navigate('/admin/examenes')} className="action-btn" style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                ← Volver
                            </button>
                            <h2>Preguntas del examen</h2>
                        </div>
                        {!editandoId && (
                            <button onClick={() => { setMostrarForm(!mostrarForm); setError(''); }} className="btn-primary">
                                {mostrarForm ? 'Cancelar' : '+ Nueva pregunta'}
                            </button>
                        )}
                    </div>

                    {error && <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

                    {(mostrarForm || editandoId) && (
                        <div className="admin-form-card" style={{ borderColor: editandoId ? 'rgba(234, 179, 8, 0.4)' : undefined }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="admin-form-group" style={{ margin: 0 }}>
                                    <label>Enunciado</label>
                                    <input value={enunciado} onChange={e => setEnunciado(e.target.value)} placeholder="Escribe la pregunta..." />
                                </div>
                                <div className="admin-form-group" style={{ margin: 0 }}>
                                    <label>Tipo</label>
                                    <select value={tipo} onChange={e => handleCambioTipo(e.target.value as TipoPregunta)} disabled={!!editandoId}
                                        style={{ padding: '0.7rem 1rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: 'white', fontSize: '0.95rem' }}>
                                        {Object.entries(etiquetaTipo).map(([val, label]) => <option key={val} value={val} style={{ color: '#000' }}>{label}</option>)}
                                    </select>
                                    {editandoId && <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>El tipo no se puede cambiar</p>}
                                </div>
                                <div className="admin-form-group" style={{ margin: 0 }}>
                                    <label>Puntaje</label>
                                    <input type="number" min="1" value={puntaje} onChange={e => setPuntaje(e.target.value)} style={{ width: '90px' }} />
                                </div>
                            </div>
                            {renderCamposExtra()}
                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                                <button onClick={editandoId ? handleEditar : handleCrear} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                                    {editandoId ? 'Guardar cambios' : 'Agregar pregunta'}
                                </button>
                                <button onClick={limpiarForm} className="action-btn" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {cargando ? <p style={{ color: '#94a3b8' }}>Cargando preguntas...</p> : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Enunciado</th>
                                        <th>Tipo</th>
                                        <th>Puntaje</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preguntas.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
                                                No hay preguntas registradas. Agrega la primera pregunta.
                                            </td>
                                        </tr>
                                    ) : (
                                        preguntas.map(p => (
                                            <tr key={p.id} style={{ background: editandoId === p.id ? 'rgba(234, 179, 8, 0.05)' : undefined }}>
                                                <td>{p.orden}</td>
                                                <td style={{ fontWeight: 500 }}>{p.enunciado}</td>
                                                <td>
                                                    <span className="badge" style={{ background: 'rgba(168, 192, 255, 0.15)', color: '#a8c0ff', border: '1px solid rgba(168, 192, 255, 0.3)' }}>
                                                        {etiquetaTipo[p.tipo]}
                                                    </span>
                                                </td>
                                                <td>{p.puntaje} pts</td>
                                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => iniciarEdicion(p)} className="action-btn" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>Editar</button>
                                                    <button onClick={() => handleEliminar(p.id)} className="action-btn btn-danger">Eliminar</button>
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
        </div>
    );
};

export default ExamenDetallePage;
