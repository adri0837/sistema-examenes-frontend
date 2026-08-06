import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api, { obtenerMensajeError } from '../../api/axios';
import './Admin.css';

interface RespuestaAbierta {
    id: string;
    texto_respuesta: string;
    revisado_por_admin: boolean;
    pregunta: { enunciado: string; puntaje: number | string; };
}

interface Intento {
    id: string;
    estudiante: { nombre: string; email: string; };
    examen: { titulo: string; };
    entregado_en: string;
    respuestas: RespuestaAbierta[];
}

const RevisionPage = () => {
    const [pendientes, setPendientes] = useState<Intento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [puntajes, setPuntajes] = useState<Record<string, string>>({});
    const [expandido, setExpandido] = useState<string | null>(null);
    const [error, setError] = useState('');

    const cargarPendientes = async () => {
        try {
            const { data } = await api.get('/revision/pendientes');
            setPendientes(data);
        } catch {
            setError('Error al cargar pendientes');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarPendientes(); }, []);

    const handlePuntajeChange = (respuestaId: string, value: string, maxPuntaje: number) => {
        if (value === '') { setPuntajes(prev => ({ ...prev, [respuestaId]: '' })); return; }
        const num = Number(value);
        if (Number.isNaN(num)) return;
        setPuntajes(prev => ({ ...prev, [respuestaId]: String(Math.min(Math.max(0, num), maxPuntaje)) }));
    };

    const handleCalificar = async (respuesta_id: string, maxPuntaje: number) => {
        const raw = puntajes[respuesta_id];
        if (raw === undefined || raw === '') { setError('Ingresa un puntaje antes de guardar'); return; }
        const puntaje = Math.min(Math.max(0, Number(raw)), maxPuntaje);
        if (Number.isNaN(puntaje)) { setError('El puntaje ingresado no es válido'); return; }
        try {
            setError('');
            await api.patch(`/revision/respuestas/${respuesta_id}`, { puntaje_obtenido: puntaje });
            setPuntajes(prev => { const n = { ...prev }; delete n[respuesta_id]; return n; });
            cargarPendientes();
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al calificar respuesta'));
        }
    };

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Revisión de Respuestas Abiertas</h2>
                    </div>

                    {error && (
                        <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                            {error}
                        </p>
                    )}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando datos...</p> : pendientes.length === 0 ? (
                        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ color: '#9ca3af', margin: 0 }}>No hay respuestas pendientes de revisión.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                            {pendientes.map(intento => (
                                <div key={intento.id} style={{
                                    background: 'white', border: '1px solid #e8e5de',
                                    borderRadius: '12px', overflow: 'hidden',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                                }}>
                                    {/* Header del intento */}
                                    <div style={{
                                        padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', cursor: 'pointer',
                                        background: expandido === intento.id ? '#f7f6f2' : 'white',
                                        borderBottom: expandido === intento.id ? '1px solid #e8e5de' : 'none',
                                        transition: 'background 0.15s ease'
                                    }}
                                        onClick={() => setExpandido(expandido === intento.id ? null : intento.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>
                                                {intento.estudiante.nombre}
                                            </span>
                                            <span style={{ color: '#6b7280', fontSize: '0.88rem' }}>
                                                {intento.estudiante.email}
                                            </span>
                                            <span style={{ color: '#16a34a', fontSize: '0.88rem', fontWeight: 600 }}>
                                                {intento.examen.titulo}
                                            </span>
                                            <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>
                                                {new Date(intento.entregado_en).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                            <span className="badge badge-warning">
                                                {intento.respuestas.length} pendiente(s)
                                            </span>
                                            <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
                                                {expandido === intento.id ? '▲ Cerrar' : '▼ Revisar'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Respuestas expandidas */}
                                    {expandido === intento.id && (
                                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {intento.respuestas.map(ra => {
                                                const maxPuntaje = Number(ra.pregunta.puntaje);
                                                return (
                                                    <div key={ra.id} style={{
                                                        border: '1px solid #e8e5de', borderRadius: '8px',
                                                        padding: '1.25rem', background: '#fafaf8'
                                                    }}>
                                                        <p style={{ fontWeight: 600, fontSize: '0.92rem', margin: '0 0 0.75rem', color: '#1a1a1a' }}>
                                                            <span style={{ color: '#16a34a' }}>Pregunta: </span>
                                                            {ra.pregunta.enunciado}
                                                        </p>
                                                        <div style={{
                                                            background: 'white', padding: '1rem', borderRadius: '6px',
                                                            fontSize: '0.92rem', marginBottom: '1rem', color: '#374151',
                                                            border: '1px solid #e8e5de', minHeight: '60px', lineHeight: 1.6
                                                        }}>
                                                            {ra.texto_respuesta || <em style={{ color: '#9ca3af' }}>El estudiante no escribió ninguna respuesta.</em>}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                                            background: '#f0fdf4', padding: '0.85rem 1rem',
                                                            borderRadius: '8px', border: '1px solid #bbf7d0'
                                                        }}>
                                                            <label style={{ fontSize: '0.88rem', color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                                Puntaje (máx. {maxPuntaje}):
                                                            </label>
                                                            <input
                                                                type="number" min={0} max={maxPuntaje} step="0.01"
                                                                value={puntajes[ra.id] ?? ''}
                                                                onChange={e => handlePuntajeChange(ra.id, e.target.value, maxPuntaje)}
                                                                style={{
                                                                    padding: '0.45rem 0.7rem', background: 'white',
                                                                    border: '1px solid #e8e5de', borderRadius: '6px',
                                                                    fontSize: '0.92rem', width: '90px', outline: 'none',
                                                                    color: '#1a1a1a'
                                                                }}
                                                            />
                                                            <button onClick={() => handleCalificar(ra.id, maxPuntaje)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                                                                Guardar calificación
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RevisionPage;