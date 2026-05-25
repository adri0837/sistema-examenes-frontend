import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarAdmin from '../../components/admin/NavbarAdmin';

type TipoPregunta = 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'ABIERTA' | 'RELACIONAR' | 'COMPLETAR';

const preguntasEjemplo = [
    { id: 'p1', orden: 1, enunciado: '¿Cuánto es 2 + 2?', tipo: 'OPCION_MULTIPLE' as TipoPregunta, puntaje: 10 },
    { id: 'p2', orden: 2, enunciado: 'La Tierra es plana.', tipo: 'VERDADERO_FALSO' as TipoPregunta, puntaje: 10 },
    { id: 'p3', orden: 3, enunciado: 'Explica el teorema de Pitágoras.', tipo: 'ABIERTA' as TipoPregunta, puntaje: 20 },
];

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
    const [mostrarForm, setMostrarForm] = useState(false);
    const [enunciado, setEnunciado] = useState('');
    const [tipo, setTipo] = useState<TipoPregunta>('OPCION_MULTIPLE');
    const [puntaje, setPuntaje] = useState('');

    const handleCrear = () => {
        console.log({ enunciado, tipo, puntaje });
        setMostrarForm(false);
        setEnunciado(''); setTipo('OPCION_MULTIPLE'); setPuntaje('');
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
                <p style={{ color: '#666', fontSize: '14px' }}>ID del examen: {id}</p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button onClick={() => setMostrarForm(!mostrarForm)}
                        style={{ padding: '0.5rem 1rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        {mostrarForm ? 'Cancelar' : '+ Nueva pregunta'}
                    </button>
                </div>

                {mostrarForm && (
                    <div style={{ padding: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Enunciado</label>
                            <input value={enunciado} onChange={e => setEnunciado(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Tipo</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value as TipoPregunta)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                                {Object.entries(etiquetaTipo).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Puntaje</label>
                            <input type="number" value={puntaje} onChange={e => setPuntaje(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '80px' }} />
                        </div>
                        <button onClick={handleCrear}
                            style={{ padding: '0.4rem 1rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            Agregar
                        </button>
                    </div>
                )}

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
                        {preguntasEjemplo.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{p.orden}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{p.enunciado}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                    <span style={{ background: '#EBF4FF', color: '#2B6CB0', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>
                                        {etiquetaTipo[p.tipo]}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{p.puntaje} pts</td>
                                <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <button style={{ padding: '0.3rem 0.7rem', background: '#ECC94B', color: '#744210', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        Editar
                                    </button>
                                    <button style={{ padding: '0.3rem 0.7rem', background: '#E53E3E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExamenDetallePage;