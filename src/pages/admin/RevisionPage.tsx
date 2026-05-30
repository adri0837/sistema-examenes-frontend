import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';
import './Admin.css';

interface RespuestaAbierta {
    id: string;
    texto_respuesta: string;
    revisado_por_admin: boolean;
    pregunta: { enunciado: string; puntaje: number; };
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

    const handleCalificar = async (respuesta_id: string) => {
        try {
            setError('');
            await api.patch(`/revision/respuestas/${respuesta_id}`, { puntaje_obtenido: Number(puntajes[respuesta_id]) });
            cargarPendientes();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al calificar respuesta');
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
                    {error && <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

                    {cargando ? <p style={{ color: '#94a3b8' }}>Cargando datos...</p> : pendientes.length === 0 ? (
                        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            <p>No hay respuestas pendientes de revisión.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            {pendientes.map(intento => (
                                <div key={intento.id} style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                                    <div style={{ padding: '1.2rem 1.5rem', background: expandido === intento.id ? 'rgba(15, 23, 42, 0.8)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: expandido === intento.id ? '1px solid rgba(255, 255, 255, 0.1)' : 'none', transition: 'all 0.3s ease' }}
                                        onClick={() => setExpandido(expandido === intento.id ? null : intento.id)}>
                                        <div>
                                            <span style={{ fontWeight: '600', fontSize: '15px', color: '#f8fafc' }}>{intento.estudiante.nombre}</span>
                                            <span style={{ color: '#a8c0ff', fontSize: '14px', marginLeft: '1rem', fontWeight: 500 }}>{intento.examen.titulo}</span>
                                            <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '1rem' }}>{new Date(intento.entregado_en).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                                {intento.respuestas.length} pendiente(s)
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{expandido === intento.id ? '▲ Cerrar' : '▼ Revisar'}</span>
                                        </div>
                                    </div>

                                    {expandido === intento.id && (
                                        <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                                            {intento.respuestas.map(ra => (
                                                <div key={ra.id} style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.4)' }}>
                                                    <p style={{ fontWeight: '600', fontSize: '15px', margin: '0 0 0.8rem', color: '#e2e8f0' }}><span style={{ color: '#a8c0ff' }}>Pregunta:</span> {ra.pregunta.enunciado}</p>
                                                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '6px', fontSize: '14.5px', marginBottom: '1rem', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.05)', minHeight: '60px' }}>
                                                        {ra.texto_respuesta || <em style={{ color: '#64748b' }}>El estudiante no escribió ninguna respuesta.</em>}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                                                        <label style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>Puntaje (máximo {ra.pregunta.puntaje}):</label>
                                                        <input type="number" min={0} max={ra.pregunta.puntaje}
                                                            value={puntajes[ra.id] || ''}
                                                            onChange={e => setPuntajes(prev => ({ ...prev, [ra.id]: e.target.value }))}
                                                            style={{ padding: '0.5rem 0.8rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(168, 192, 255, 0.3)', borderRadius: '6px', fontSize: '14px', width: '90px', color: 'white' }} />
                                                        <button onClick={() => handleCalificar(ra.id)} className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '13px' }}>
                                                            Guardar Calificación
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
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