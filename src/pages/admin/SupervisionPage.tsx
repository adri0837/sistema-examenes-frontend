import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api, { obtenerMensajeError } from '../../api/axios';
import type { IntentoSupervision, IncidenteSupervision, Evidencia, EstadoIntento } from '../../types';
import './Admin.css';

const BASE_MEDIA = 'http://localhost:3000';

const estadoBadge = (estado: EstadoIntento) => {
    const map: Record<EstadoIntento, { clase: string; texto: string }> = {
        EN_PROGRESO: { clase: 'badge-info', texto: 'En progreso' },
        ENTREGADO: { clase: 'badge-warning', texto: 'Entregado' },
        CALIFICADO: { clase: 'badge-active', texto: 'Calificado' },
        CANCELADO: { clase: 'badge-warning', texto: 'Cancelado' },
        REPROBADO: { clase: 'badge-danger', texto: 'Reprobado' },
    };
    const { clase, texto } = map[estado];
    return <span className={`badge ${clase}`}>{texto}</span>;
};

const tipoIncidenteLabel = (tipo: string) =>
    tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const formatearFecha = (f: string | null) => {
    if (!f) return '—';
    const d = new Date(f);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const renderEvidencia = (ev: Evidencia) => {
    const src = `${BASE_MEDIA}${ev.url}`;
    const mime = (ev.mime || '').toLowerCase();
    if (mime.startsWith('image/')) {
        return <img src={src} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid #e8e5de' }} />;
    }
    if (mime.startsWith('audio/')) {
        return <audio controls preload="metadata" src={src} style={{ width: '100%' }} />;
    }
    if (mime.startsWith('video/')) {
        return <video controls preload="metadata" src={src} style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid #e8e5de' }} />;
    }
    return (
        <a href={src} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '0.85rem' }}>
            Abrir archivo
        </a>
    );
};

const SupervisionPage = () => {
    const [intentos, setIntentos] = useState<IntentoSupervision[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [expandido, setExpandido] = useState<string | null>(null);
    const [detalle, setDetalle] = useState<{ incidentes: IncidenteSupervision[]; evidencias: Evidencia[] } | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [accion, setAccion] = useState<{ intentoId: string; tipo: 'reprobar' | 'reintento' } | null>(null);
    const [motivo, setMotivo] = useState('');

    const cargar = async () => {
        try {
            setError('');
            const { data } = await api.get('/admin/supervision/intentos');
            setIntentos(data);
        } catch {
            setError('Error al cargar los intentos con actividad de supervisión');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const cargarDetalle = async (intentoId: string) => {
        setCargandoDetalle(true);
        setDetalle(null);
        try {
            const [inc, ev] = await Promise.all([
                api.get(`/admin/intentos/${intentoId}/incidentes`),
                api.get(`/admin/intentos/${intentoId}/evidencias`),
            ]);
            setDetalle({ incidentes: inc.data, evidencias: ev.data });
        } catch {
            setDetalle({ incidentes: [], evidencias: [] });
            setError('Error al cargar el detalle de supervisión');
        } finally {
            setCargandoDetalle(false);
        }
    };

    const handleToggleExpandir = (intentoId: string) => {
        if (expandido === intentoId) {
            setExpandido(null);
            setDetalle(null);
            return;
        }
        setExpandido(intentoId);
        setAccion(null);
        cargarDetalle(intentoId);
    };

    const ejecutarAccion = async () => {
        if (!accion) return;
        const { intentoId, tipo } = accion;
        try {
            setError('');
            if (tipo === 'reprobar') {
                await api.patch(`/admin/intentos/${intentoId}/reprobar`, { motivo: motivo.trim() || undefined });
            } else {
                await api.patch(`/admin/intentos/${intentoId}/permitir-reintento`, { motivo: motivo.trim() || undefined });
            }
            setAccion(null);
            setMotivo('');
            cargar();
            if (expandido) cargarDetalle(expandido);
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al realizar la acción'));
        }
    };

    const puedeReintento = (intento: IntentoSupervision) =>
        (intento.estado === 'REPROBADO' || intento.estado === 'CANCELADO') && !intento.reintento_permitido;

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Supervisión de Exámenes</h2>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Intentos con incidentes o evidencias de supervisión. Podés reprobar un intento o permitir un reintento.
                    </p>

                    {error && (
                        <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                            {error}
                        </p>
                    )}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando datos...</p> : intentos.length === 0 ? (
                        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ color: '#9ca3af', margin: 0 }}>No hay intentos con incidentes ni evidencias de supervisión.</p>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Estudiante</th>
                                        <th>Examen</th>
                                        <th>Estado</th>
                                        <th>Llamadas</th>
                                        <th>Incidentes</th>
                                        <th>Evidencias</th>
                                        <th>Iniciado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {intentos.map(intento => (
                                        <tr key={intento.id}>
                                            <td style={{ fontWeight: 500 }}>{intento.estudiante.nombre}</td>
                                            <td style={{ color: '#6b7280' }}>{intento.examen.titulo}</td>
                                            <td>{estadoBadge(intento.estado)}</td>
                                            <td style={{ textAlign: 'center', color: intento.llamadas_atencion >= 2 ? '#dc2626' : '#374151' }}>
                                                {intento.llamadas_atencion}/2
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#6b7280' }}>{intento._count.incidentes}</td>
                                            <td style={{ textAlign: 'center', color: '#6b7280' }}>{intento._count.evidencias}</td>
                                            <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{formatearFecha(intento.iniciado_en)}</td>
                                            <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button onClick={() => handleToggleExpandir(intento.id)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
                                                    {expandido === intento.id ? 'Cerrar' : 'Revisar'}
                                                </button>
                                                <button
                                                    onClick={() => { setAccion({ intentoId: intento.id, tipo: 'reprobar' }); setMotivo(''); }}
                                                    className="action-btn btn-danger"
                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                                                >
                                                    Reprobar
                                                </button>
                                                <button
                                                    onClick={() => { setAccion({ intentoId: intento.id, tipo: 'reintento' }); setMotivo(''); }}
                                                    disabled={!puedeReintento(intento)}
                                                    className="action-btn btn-success"
                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', opacity: puedeReintento(intento) ? 1 : 0.45, cursor: puedeReintento(intento) ? 'pointer' : 'not-allowed' }}
                                                >
                                                    Reintento
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {expandido && (
                        <div style={{ marginTop: '1rem' }}>
                            {accion && (
                                <div className="admin-form-card" style={{ marginBottom: '1rem' }}>
                                    <div className="admin-form-group">
                                        <label>
                                            {accion.tipo === 'reprobar' ? 'Reprobar intento (se descartan las respuestas y la calificación)' : 'Permitir reintento al estudiante'}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={motivo}
                                            onChange={e => setMotivo(e.target.value)}
                                            placeholder="Motivo (opcional)..."
                                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e8e5de', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button onClick={ejecutarAccion} className="btn-primary">Confirmar</button>
                                        <button onClick={() => { setAccion(null); setMotivo(''); }} className="action-btn">Cancelar</button>
                                    </div>
                                </div>
                            )}

                            <div style={{
                                background: 'white', border: '1px solid #e8e5de', borderRadius: '12px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '1.25rem'
                            }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1a1a1a' }}>Detalle de supervisión</h3>
                                {cargandoDetalle ? (
                                    <p style={{ color: '#6b7280' }}>Cargando detalle...</p>
                                ) : detalle && detalle.incidentes.length === 0 && detalle.evidencias.length === 0 ? (
                                    <p style={{ color: '#9ca3af' }}>Sin incidentes ni evidencias.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {detalle?.incidentes.map(inc => (
                                            <div key={inc.id} style={{ border: '1px solid #e8e5de', borderRadius: '8px', padding: '1rem', background: '#fafaf8' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <span className="badge badge-danger">{tipoIncidenteLabel(inc.tipo)}</span>
                                                    <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{formatearFecha(inc.creado_en)}</span>
                                                </div>
                                                {inc.descripcion && <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.5rem 0 0' }}>{inc.descripcion}</p>}
                                                {inc.evidencias && inc.evidencias.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                        {inc.evidencias.map(ev => (
                                                            <div key={ev.id} style={{ flex: '1 1 200px', minWidth: '200px', background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e8e5de' }}>
                                                                {renderEvidencia(ev)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {detalle && detalle.evidencias.length > 0 && (
                                            <>
                                                <h4 style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#374151' }}>Evidencias sin incidente asociado</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                    {detalle.evidencias.filter(ev => !ev.incidente_id).map(ev => (
                                                        <div key={ev.id} style={{ flex: '1 1 200px', minWidth: '200px', background: '#fafaf8', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e8e5de' }}>
                                                            {renderEvidencia(ev)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupervisionPage;
