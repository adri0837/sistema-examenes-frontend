import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';

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
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h2>Revisión de Respuestas Abiertas</h2>
                {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

                {cargando ? <p style={{ color: '#666' }}>Cargando...</p> : pendientes.length === 0 ? (
                    <p style={{ color: '#666', marginTop: '1rem' }}>✅ No hay respuestas pendientes de revisión.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {pendientes.map(intento => (
                            <div key={intento.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ padding: '0.75rem 1rem', background: '#F7FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                    onClick={() => setExpandido(expandido === intento.id ? null : intento.id)}>
                                    <div>
                                        <span style={{ fontWeight: '500', fontSize: '14px' }}>{intento.estudiante.nombre}</span>
                                        <span style={{ color: '#666', fontSize: '13px', marginLeft: '1rem' }}>{intento.examen.titulo}</span>
                                        <span style={{ color: '#999', fontSize: '12px', marginLeft: '1rem' }}>{new Date(intento.entregado_en).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ background: '#FEFCBF', color: '#744210', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>
                                            {intento.respuestas.length} pendiente(s)
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{expandido === intento.id ? '▲ Cerrar' : '▼ Revisar'}</span>
                                    </div>
                                </div>

                                {expandido === intento.id && (
                                    <div style={{ padding: '1rem' }}>
                                        {intento.respuestas.map(ra => (
                                            <div key={ra.id} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem' }}>
                                                <p style={{ fontWeight: '500', fontSize: '14px', margin: '0 0 0.5rem' }}>Pregunta: {ra.pregunta.enunciado}</p>
                                                <div style={{ background: '#F7FAFC', padding: '0.75rem', borderRadius: '4px', fontSize: '14px', marginBottom: '0.75rem' }}>
                                                    {ra.texto_respuesta || <em style={{ color: '#999' }}>Sin respuesta</em>}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <label style={{ fontSize: '13px' }}>Puntaje (máx. {ra.pregunta.puntaje}):</label>
                                                    <input type="number" min={0} max={ra.pregunta.puntaje}
                                                        value={puntajes[ra.id] || ''}
                                                        onChange={e => setPuntajes(prev => ({ ...prev, [ra.id]: e.target.value }))}
                                                        style={{ padding: '0.3rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '80px' }} />
                                                    <button onClick={() => handleCalificar(ra.id)}
                                                        style={{ padding: '0.3rem 0.8rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                                                        Guardar
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
    );
};

export default RevisionPage;