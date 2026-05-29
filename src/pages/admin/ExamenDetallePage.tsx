import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';

type TipoPregunta = 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'ABIERTA' | 'RELACIONAR' | 'COMPLETAR';

interface Opcion { id?: string; texto: string; es_correcta: boolean; }
interface Par { id?: string; lado_izquierdo: string; lado_derecho: string; }
interface Espacio { id?: string; respuesta_correcta: string; }
interface Pregunta {
    id: string; orden: number; enunciado: string; tipo: TipoPregunta; puntaje: number;
    opciones: Opcion[]; pares: Par[]; espacios: Espacio[];
}

const etiquetaTipo: Record<TipoPregunta, string> = {
    OPCION_MULTIPLE: 'Opción múltiple', VERDADERO_FALSO: 'Verdadero / Falso',
    ABIERTA: 'Respuesta abierta', RELACIONAR: 'Relacionar columnas', COMPLETAR: 'Completar espacios',
};

const ExamenDetallePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mostrarForm, setMostrarForm] = useState(false);
    const [enunciado, setEnunciado] = useState('');
    const [tipo, setTipo] = useState<TipoPregunta>('OPCION_MULTIPLE');
    const [puntaje, setPuntaje] = useState('');
    const [opciones, setOpciones] = useState<Opcion[]>([{ texto: '', es_correcta: false }, { texto: '', es_correcta: false }]);
    const [pares, setPares] = useState<Par[]>([{ lado_izquierdo: '', lado_derecho: '' }]);
    const [espacios, setEspacios] = useState<Espacio[]>([{ respuesta_correcta: '' }]);

    const cargarPreguntas = async () => {
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
        setEnunciado(''); setTipo('OPCION_MULTIPLE'); setPuntaje('');
        setOpciones([{ texto: '', es_correcta: false }, { texto: '', es_correcta: false }]);
        setPares([{ lado_izquierdo: '', lado_derecho: '' }]);
        setEspacios([{ respuesta_correcta: '' }]);
        setMostrarForm(false);
    };

    const handleCrear = async () => {
        try {
            setError('');
            await api.post(`/examenes/${id}/preguntas`, {
                enunciado, tipo, puntaje: Number(puntaje),
                opciones: (tipo === 'OPCION_MULTIPLE' || tipo === 'VERDADERO_FALSO') ? opciones : undefined,
                pares: tipo === 'RELACIONAR' ? pares : undefined,
                espacios: tipo === 'COMPLETAR' ? espacios : undefined,
            });
            limpiarForm(); cargarPreguntas();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al crear pregunta');
        }
    };

    const handleEliminar = async (pregunta_id: string) => {
        try {
            setError('');
            await api.delete(`/preguntas/${pregunta_id}`);
            cargarPreguntas();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al eliminar pregunta');
        }
    };

    const renderCamposExtra = () => {
        if (tipo === 'OPCION_MULTIPLE' || tipo === 'VERDADERO_FALSO') {
            return (
                <div>
                    <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Opciones</label>
                    {opciones.map((op, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <input value={op.texto} placeholder={`Opción ${i + 1}`} onChange={e => {
                                const nuevas = [...opciones]; nuevas[i].texto = e.target.value; setOpciones(nuevas);
                            }} style={{ padding: '0.3rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '180px' }} />
                            <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="checkbox" checked={op.es_correcta} onChange={e => {
                                    const nuevas = [...opciones]; nuevas[i].es_correcta = e.target.checked; setOpciones(nuevas);
                                }} /> Correcta
                            </label>
                        </div>
                    ))}
                    <button onClick={() => setOpciones([...opciones, { texto: '', es_correcta: false }])}
                        style={{ fontSize: '12px', padding: '0.2rem 0.6rem', background: '#E2E8F0', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.25rem' }}>
                        + Opción
                    </button>
                </div>
            );
        }
        if (tipo === 'RELACIONAR') {
            return (
                <div>
                    <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Pares</label>
                    {pares.map((par, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <input value={par.lado_izquierdo} placeholder="Izquierdo" onChange={e => {
                                const nuevos = [...pares]; nuevos[i].lado_izquierdo = e.target.value; setPares(nuevos);
                            }} style={{ padding: '0.3rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '150px' }} />
                            <input value={par.lado_derecho} placeholder="Derecho" onChange={e => {
                                const nuevos = [...pares]; nuevos[i].lado_derecho = e.target.value; setPares(nuevos);
                            }} style={{ padding: '0.3rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '150px' }} />
                        </div>
                    ))}
                    <button onClick={() => setPares([...pares, { lado_izquierdo: '', lado_derecho: '' }])}
                        style={{ fontSize: '12px', padding: '0.2rem 0.6rem', background: '#E2E8F0', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.25rem' }}>
                        + Par
                    </button>
                </div>
            );
        }
        if (tipo === 'COMPLETAR') {
            return (
                <div>
                    <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Respuestas correctas por espacio</label>
                    {espacios.map((esp, i) => (
                        <div key={i} style={{ marginBottom: '0.4rem' }}>
                            <input value={esp.respuesta_correcta} placeholder={`Espacio ${i + 1}`} onChange={e => {
                                const nuevos = [...espacios]; nuevos[i].respuesta_correcta = e.target.value; setEspacios(nuevos);
                            }} style={{ padding: '0.3rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', width: '180px' }} />
                        </div>
                    ))}
                    <button onClick={() => setEspacios([...espacios, { respuesta_correcta: '' }])}
                        style={{ fontSize: '12px', padding: '0.2rem 0.6rem', background: '#E2E8F0', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.25rem' }}>
                        + Espacio
                    </button>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <button onClick={() => navigate('/admin/examenes')}
                        style={{ padding: '0.3rem 0.7rem', background: '#E2E8F0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                        ← Volver
                    </button>
                    <h2 style={{ margin: 0 }}>Preguntas del examen</h2>
                </div>

                {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button onClick={() => setMostrarForm(!mostrarForm)}
                        style={{ padding: '0.5rem 1rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        {mostrarForm ? 'Cancelar' : '+ Nueva pregunta'}
                    </button>
                </div>

                {mostrarForm && (
                    <div style={{ padding: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Enunciado</label>
                            <input value={enunciado} onChange={e => setEnunciado(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Tipo</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value as TipoPregunta)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                                {Object.entries(etiquetaTipo).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Puntaje</label>
                            <input type="number" value={puntaje} onChange={e => setPuntaje(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '80px' }} />
                        </div>
                        <div style={{ width: '100%' }}>{renderCamposExtra()}</div>
                        <button onClick={handleCrear}
                            style={{ padding: '0.4rem 1rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            Agregar
                        </button>
                    </div>
                )}

                {cargando ? <p style={{ color: '#666' }}>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>#</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Enunciado</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Tipo</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Puntaje</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preguntas.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{p.orden}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{p.enunciado}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                        <span style={{ background: '#EBF4FF', color: '#2B6CB0', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>
                                            {etiquetaTipo[p.tipo]}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{p.puntaje} pts</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <button onClick={() => handleEliminar(p.id)}
                                            style={{ padding: '0.3rem 0.7rem', background: '#E53E3E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ExamenDetallePage;