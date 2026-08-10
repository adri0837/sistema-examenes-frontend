import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api, { obtenerMensajeError } from '../../api/axios';
import type { GrupoResumen, GrupoDetalle, EstudianteDisponible } from '../../types';
import './Admin.css';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface ExamenAdmin {
    id: string;
    titulo: string;
    publicado: boolean;
}

const formatearFechaLocal = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const aISO = (value: string) => (value ? new Date(value).toISOString() : null);

const GruposPage = () => {
    const [grupos, setGrupos] = useState<GrupoResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState<GrupoResumen | null>(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const [expandido, setExpandido] = useState<string | null>(null);
    const [detalle, setDetalle] = useState<GrupoDetalle | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [disponibles, setDisponibles] = useState<EstudianteDisponible[]>([]);
    const [seleccionados, setSeleccionados] = useState<string[]>([]);
    const [examenes, setExamenes] = useState<ExamenAdmin[]>([]);
    const [asignando, setAsignando] = useState<{ mostrar: boolean; examen_id: string; fecha_inicio: string; fecha_fin: string }>({ mostrar: false, examen_id: '', fecha_inicio: '', fecha_fin: '' });
    const [editandoFechas, setEditandoFechas] = useState<{ grupo_id: string; examen_id: string; fecha_inicio: string; fecha_fin: string } | null>(null);
    const [dialog, setDialog] = useState<{ mensaje: string; onConfirmar: () => void } | null>(null);

    const cargar = async () => {
        try {
            setError('');
            const { data } = await api.get('/grupos');
            setGrupos(data);
        } catch {
            setError('Error al cargar los grupos');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const cargarDetalle = async (grupoId: string) => {
        setCargandoDetalle(true);
        setDetalle(null);
        try {
            const [det, disp, ex] = await Promise.all([
                api.get(`/grupos/${grupoId}`),
                api.get(`/grupos/${grupoId}/estudiantes/disponibles`),
                api.get('/examenes'),
            ]);
            setDetalle(det.data);
            setDisponibles(disp.data);
            setExamenes(ex.data);
        } catch {
            setError('Error al cargar el detalle del grupo');
        } finally {
            setCargandoDetalle(false);
        }
    };

    const handleToggleExpandir = (grupoId: string) => {
        if (expandido === grupoId) {
            setExpandido(null);
            setDetalle(null);
            return;
        }
        setExpandido(grupoId);
        setSeleccionados([]);
        setAsignando({ mostrar: false, examen_id: '', fecha_inicio: '', fecha_fin: '' });
        setEditandoFechas(null);
        cargarDetalle(grupoId);
    };

    const limpiarForm = () => {
        setNombre('');
        setDescripcion('');
        setMostrarForm(false);
        setEditando(null);
    };

    const handleCrear = async () => {
        try {
            setError('');
            await api.post('/grupos', { nombre, descripcion });
            limpiarForm();
            cargar();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al crear el grupo'));
        }
    };

    const handleEditar = async () => {
        if (!editando) return;
        try {
            setError('');
            await api.put(`/grupos/${editando.id}`, { nombre, descripcion });
            limpiarForm();
            cargar();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al editar el grupo'));
        }
    };

    const handleEliminar = (grupo: GrupoResumen) => {
        setDialog({
            mensaje: `¿Eliminar el grupo "${grupo.nombre}"? Se removerán sus ${grupo._count.estudiantes} estudiante(s) y ${grupo._count.asignaciones} asignación(es). Esta acción no se puede deshacer.`,
            onConfirmar: async () => {
                setDialog(null);
                try {
                    setError('');
                    await api.delete(`/grupos/${grupo.id}`);
                    if (expandido === grupo.id) setExpandido(null);
                    cargar();
                } catch (e) {
                    setError(obtenerMensajeError(e, 'Error al eliminar el grupo'));
                }
            },
        });
    };

    const iniciarEdicion = (grupo: GrupoResumen) => {
        setEditando(grupo);
        setNombre(grupo.nombre);
        setDescripcion(grupo.descripcion || '');
        setMostrarForm(false);
    };

    const agregarEstudiantes = async () => {
        if (!expandido || seleccionados.length === 0) return;
        try {
            setError('');
            await api.post(`/grupos/${expandido}/estudiantes`, { estudiante_ids: seleccionados });
            setSeleccionados([]);
            cargarDetalle(expandido);
            cargar();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al agregar estudiantes'));
        }
    };

    const quitarEstudiante = async (estudianteId: string) => {
        if (!expandido) return;
        try {
            setError('');
            await api.delete(`/grupos/${expandido}/estudiantes/${estudianteId}`);
            cargarDetalle(expandido);
            cargar();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al quitar el estudiante'));
        }
    };

    const asignarExamen = async () => {
        if (!expandido || !asignando.examen_id) {
            setError('Seleccioná un examen para asignar');
            return;
        }
        try {
            setError('');
            await api.post(`/grupos/${expandido}/examenes`, {
                examen_id: asignando.examen_id,
                fecha_inicio: aISO(asignando.fecha_inicio),
                fecha_fin: aISO(asignando.fecha_fin),
            });
            setAsignando({ mostrar: false, examen_id: '', fecha_inicio: '', fecha_fin: '' });
            cargarDetalle(expandido);
            cargar();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al asignar el examen'));
        }
    };

    const guardarFechas = async () => {
        if (!editandoFechas || !expandido) return;
        try {
            setError('');
            await api.put(`/grupos/${editandoFechas.grupo_id}/examenes/${editandoFechas.examen_id}`, {
                fecha_inicio: aISO(editandoFechas.fecha_inicio),
                fecha_fin: aISO(editandoFechas.fecha_fin),
            });
            setEditandoFechas(null);
            cargarDetalle(expandido);
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al actualizar la ventana de rendición'));
        }
    };

    const desasignarExamen = async (examenId: string) => {
        if (!expandido) return;
        try {
            setError('');
            await api.delete(`/grupos/${expandido}/examenes/${examenId}`);
            cargarDetalle(expandido);
            cargar();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al desasignar el examen'));
        }
    };

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Gestión de Grupos</h2>
                        <button onClick={() => { limpiarForm(); setMostrarForm(!mostrarForm); }} className="btn-primary">
                            {mostrarForm ? 'Cancelar' : '+ Nuevo grupo'}
                        </button>
                    </div>

                    {error && (
                        <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                            {error}
                        </p>
                    )}

                    {(mostrarForm || editando) && (
                        <div className="admin-form-card">
                            <div className="admin-form-group">
                                <label>Nombre del grupo</label>
                                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Comisión 3A" />
                            </div>
                            <div className="admin-form-group">
                                <label>Descripción</label>
                                <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción breve..." />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={editando ? handleEditar : handleCrear} className="btn-primary">
                                    {editando ? 'Guardar cambios' : 'Crear grupo'}
                                </button>
                                {editando && <button onClick={limpiarForm} className="action-btn">Cancelar</button>}
                            </div>
                        </div>
                    )}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando grupos...</p> : grupos.length === 0 ? (
                        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ color: '#9ca3af', margin: 0 }}>No hay grupos registrados.</p>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Estudiantes</th>
                                        <th>Exámenes asignados</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grupos.map(grupo => (
                                        <tr key={grupo.id}>
                                            <td style={{ fontWeight: 500 }}>{grupo.nombre}</td>
                                            <td style={{ color: '#6b7280' }}>{grupo.descripcion || '—'}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-info">{grupo._count.estudiantes}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-warning">{grupo._count.asignaciones}</span>
                                            </td>
                                            <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button onClick={() => handleToggleExpandir(grupo.id)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
                                                    {expandido === grupo.id ? 'Cerrar' : 'Detalle'}
                                                </button>
                                                <button onClick={() => iniciarEdicion(grupo)} className="action-btn">Editar</button>
                                                <button onClick={() => handleEliminar(grupo)} className="action-btn btn-danger">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {expandido && (
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cargandoDetalle ? (
                                <p style={{ color: '#6b7280' }}>Cargando detalle del grupo...</p>
                            ) : detalle ? (
                                <>
                                    <div style={{ background: 'white', border: '1px solid #e8e5de', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1a1a1a' }}>Estudiantes del grupo</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <select
                                                    multiple
                                                    value={seleccionados}
                                                    onChange={e => setSeleccionados(Array.from(e.target.selectedOptions, o => o.value))}
                                                    style={{ minWidth: '220px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e8e5de', fontSize: '0.88rem' }}
                                                >
                                                    {disponibles.map(est => (
                                                        <option key={est.id} value={est.id}>{est.nombre} ({est.email})</option>
                                                    ))}
                                                </select>
                                                <button onClick={agregarEstudiantes} disabled={seleccionados.length === 0} className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', opacity: seleccionados.length ? 1 : 0.5 }}>
                                                    Agregar
                                                </button>
                                            </div>
                                        </div>
                                        {detalle.estudiantes.length === 0 ? (
                                            <p style={{ color: '#9ca3af' }}>El grupo no tiene estudiantes. Usá el selector para agregarlos.</p>
                                        ) : (
                                            <table className="admin-table" style={{ marginTop: '0.25rem' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Estudiante</th>
                                                        <th>Email</th>
                                                        <th>Acción</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detalle.estudiantes.map(miembro => (
                                                        <tr key={miembro.id}>
                                                            <td style={{ fontWeight: 500 }}>{miembro.estudiante.nombre}</td>
                                                            <td style={{ color: '#6b7280' }}>{miembro.estudiante.email}</td>
                                                            <td>
                                                                <button onClick={() => quitarEstudiante(miembro.estudiante.id)} className="action-btn btn-danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>
                                                                    Quitar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    <div style={{ background: 'white', border: '1px solid #e8e5de', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1a1a1a' }}>Exámenes asignados</h3>
                                            <button onClick={() => setAsignando(prev => ({ ...prev, mostrar: !prev.mostrar }))} className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
                                                {asignando.mostrar ? 'Cancelar' : '+ Asignar examen'}
                                            </button>
                                        </div>

                                        {asignando.mostrar && (
                                            <div className="admin-form-card" style={{ marginBottom: '1rem' }}>
                                                <div className="admin-form-group">
                                                    <label>Examen</label>
                                                    <select value={asignando.examen_id} onChange={e => setAsignando(prev => ({ ...prev, examen_id: e.target.value }))}>
                                                        <option value="">Seleccionar...</option>
                                                        {examenes.map(ex => (
                                                            <option key={ex.id} value={ex.id}>
                                                                {ex.titulo}{ex.publicado ? '' : ' (Borrador)'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <div className="admin-form-group" style={{ flex: 1 }}>
                                                        <label>Inicio de ventana</label>
                                                        <input type="datetime-local" value={asignando.fecha_inicio} onChange={e => setAsignando(prev => ({ ...prev, fecha_inicio: e.target.value }))} />
                                                    </div>
                                                    <div className="admin-form-group" style={{ flex: 1 }}>
                                                        <label>Fin de ventana</label>
                                                        <input type="datetime-local" value={asignando.fecha_fin} onChange={e => setAsignando(prev => ({ ...prev, fecha_fin: e.target.value }))} />
                                                    </div>
                                                </div>
                                                <button onClick={asignarExamen} className="btn-primary">Asignar</button>
                                            </div>
                                        )}

                                        {detalle.asignaciones.length === 0 ? (
                                            <p style={{ color: '#9ca3af' }}>El grupo no tiene exámenes asignados.</p>
                                        ) : (
                                            <table className="admin-table" style={{ marginTop: '0.25rem' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Examen</th>
                                                        <th>Inicio</th>
                                                        <th>Fin</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detalle.asignaciones.map(asig => (
                                                        <tr key={asig.id}>
                                                            <td style={{ fontWeight: 500 }}>{asig.examen.titulo}</td>
                                                            <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                                                {editandoFechas?.examen_id === asig.examen.id ? (
                                                                    <input type="datetime-local" value={editandoFechas.fecha_inicio} onChange={e => setEditandoFechas(prev => prev && { ...prev, fecha_inicio: e.target.value })} style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid #e8e5de', fontSize: '0.8rem' }} />
                                                                ) : formatearFechaLocal(asig.fecha_inicio) || '—'}
                                                            </td>
                                                            <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                                                {editandoFechas?.examen_id === asig.examen.id ? (
                                                                    <input type="datetime-local" value={editandoFechas.fecha_fin} onChange={e => setEditandoFechas(prev => prev && { ...prev, fecha_fin: e.target.value })} style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid #e8e5de', fontSize: '0.8rem' }} />
                                                                ) : formatearFechaLocal(asig.fecha_fin) || '—'}
                                                            </td>
                                                            <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                {editandoFechas?.examen_id === asig.examen.id ? (
                                                                    <>
                                                                        <button onClick={guardarFechas} className="action-btn btn-success" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>Guardar</button>
                                                                        <button onClick={() => setEditandoFechas(null)} className="action-btn" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>Cancelar</button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button onClick={() => setEditandoFechas({ grupo_id: expandido, examen_id: asig.examen.id, fecha_inicio: formatearFechaLocal(asig.fecha_inicio), fecha_fin: formatearFechaLocal(asig.fecha_fin) })} className="action-btn" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>Ventana</button>
                                                                        <button onClick={() => desasignarExamen(asig.examen.id)} className="action-btn btn-danger" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>Quitar</button>
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </>
                            ) : null}
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

export default GruposPage;
