import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';

const examenesEjemplo = [
    { id: '1', titulo: 'Examen de Matemáticas', categoria: 'Matemáticas', tiempo_limite_min: 30, publicado: true, intentos: 5 },
    { id: '2', titulo: 'Examen de Historia', categoria: 'Historia', tiempo_limite_min: null, publicado: false, intentos: 0 },
    { id: '3', titulo: 'Examen de Ciencias', categoria: 'Ciencias', tiempo_limite_min: 45, publicado: true, intentos: 0 },
];

const ExamenesPage = () => {
    const navigate = useNavigate();
    const [mostrarForm, setMostrarForm] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState('');
    const [tiempo, setTiempo] = useState('');

    const handleCrear = () => {
        console.log({ titulo, descripcion, categoria, tiempo });
        setMostrarForm(false);
        setTitulo(''); setDescripcion(''); setCategoria(''); setTiempo('');
    };

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Gestión de Exámenes</h2>
                    <button onClick={() => setMostrarForm(!mostrarForm)}
                        style={{ padding: '0.5rem 1rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        {mostrarForm ? 'Cancelar' : '+ Nuevo examen'}
                    </button>
                </div>

                {mostrarForm && (
                    <div style={{ marginTop: '1rem', padding: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Título</label>
                            <input value={titulo} onChange={e => setTitulo(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '200px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Descripción</label>
                            <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '200px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Categoría</label>
                            <select value={categoria} onChange={e => setCategoria(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                                <option value="">Seleccionar...</option>
                                <option value="1">Matemáticas</option>
                                <option value="2">Historia</option>
                                <option value="3">Ciencias</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Tiempo límite (min)</label>
                            <input type="number" placeholder="Sin límite" value={tiempo} onChange={e => setTiempo(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '120px' }} />
                        </div>
                        <button onClick={handleCrear}
                            style={{ padding: '0.4rem 1rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            Crear
                        </button>
                    </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Título</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Categoría</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Tiempo</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Estado</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Intentos</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {examenesEjemplo.map(ex => (
                            <tr key={ex.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{ex.titulo}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{ex.categoria}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{ex.tiempo_limite_min ? `${ex.tiempo_limite_min} min` : 'Sin límite'}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                    {ex.publicado
                                        ? <span style={{ background: '#C6F6D5', color: '#276749', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Publicado</span>
                                        : <span style={{ background: '#E2E8F0', color: '#4A5568', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Borrador</span>
                                    }
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{ex.intentos}</td>
                                <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button onClick={() => navigate(`/admin/examenes/${ex.id}`)}
                                        style={{ padding: '0.3rem 0.7rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        Preguntas
                                    </button>
                                    <button disabled={ex.intentos > 0}
                                        style={{ padding: '0.3rem 0.7rem', background: ex.intentos > 0 ? '#E2E8F0' : '#ECC94B', color: ex.intentos > 0 ? '#999' : '#744210', border: 'none', borderRadius: '4px', cursor: ex.intentos > 0 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                                        Editar
                                    </button>
                                    <button disabled={ex.intentos > 0}
                                        style={{ padding: '0.3rem 0.7rem', background: ex.intentos > 0 ? '#E2E8F0' : '#E53E3E', color: ex.intentos > 0 ? '#999' : 'white', border: 'none', borderRadius: '4px', cursor: ex.intentos > 0 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                                        Eliminar
                                    </button>
                                    <button
                                        style={{ padding: '0.3rem 0.7rem', background: ex.publicado ? '#718096' : '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        {ex.publicado ? 'Despublicar' : 'Publicar'}
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

export default ExamenesPage;