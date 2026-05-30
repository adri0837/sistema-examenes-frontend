import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';

interface Categoria { id: string; nombre: string; }
interface Examen {
    id: string; titulo: string; descripcion: string | null;
    categoria: Categoria; tiempo_limite_min: number | null;
    publicado: boolean; _count: { intentos: number };
}

const ExamenesPage = () => {
    const navigate = useNavigate();
    const [examenes, setExamenes] = useState<Examen[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState<Examen | null>(null);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria_id, setCategoriaId] = useState('');
    const [tiempo, setTiempo] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    const cargarDatos = async () => {
        try {
            const [exRes, catRes] = await Promise.all([api.get('/examenes'), api.get('/categorias')]);
            setExamenes(exRes.data);
            setCategorias(catRes.data);
        } catch {
            setError('Error al cargar datos');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const limpiarForm = () => {
        setTitulo(''); setDescripcion(''); setCategoriaId(''); setTiempo('');
        setMostrarForm(false); setEditando(null);
    };

    const handleCrear = async () => {
        try {
            setError('');
            await api.post('/examenes', { titulo, descripcion, categoria_id, tiempo_limite_min: tiempo ? Number(tiempo) : null });
            limpiarForm(); cargarDatos();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al crear examen');
        }
    };

    const handleEditar = async () => {
        if (!editando) return;
        try {
            setError('');
            await api.put(`/examenes/${editando.id}`, { titulo, descripcion, categoria_id, tiempo_limite_min: tiempo ? Number(tiempo) : null });
            limpiarForm(); cargarDatos();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al editar examen');
        }
    };

    const handleEliminar = async (id: string) => {
        try {
            setError('');
            await api.delete(`/examenes/${id}`);
            cargarDatos();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al eliminar examen');
        }
    };

    const handleTogglePublicado = async (id: string) => {
        try {
            await api.patch(`/examenes/${id}/toggle-publicado`);
            cargarDatos();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al actualizar examen');
        }
    };

    const iniciarEdicion = (ex: Examen) => {
        setEditando(ex);
        setTitulo(ex.titulo);
        setDescripcion(ex.descripcion || '');
        setCategoriaId(ex.categoria.id);
        setTiempo(ex.tiempo_limite_min ? String(ex.tiempo_limite_min) : '');
        setMostrarForm(false);
    };

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Gestión de Exámenes</h2>
                    <button onClick={() => { limpiarForm(); setMostrarForm(true); }}
                        style={{ padding: '0.5rem 1rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        + Nuevo examen
                    </button>
                </div>

                {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '0.5rem' }}>{error}</p>}

                {(mostrarForm || editando) && (
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
                            <select value={categoria_id} onChange={e => setCategoriaId(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                                <option value="">Seleccionar...</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Tiempo límite (min)</label>
                            <input type="number" placeholder="Sin límite" value={tiempo} onChange={e => setTiempo(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '120px' }} />
                        </div>
                        <button onClick={editando ? handleEditar : handleCrear}
                            style={{ padding: '0.4rem 1rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            {editando ? 'Guardar cambios' : 'Crear'}
                        </button>
                        <button onClick={limpiarForm}
                            style={{ padding: '0.4rem 1rem', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            Cancelar
                        </button>
                    </div>
                )}

                {cargando ? <p style={{ marginTop: '1rem', color: '#666' }}>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                        <thead>
                            <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Título</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Descripción</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Categoría</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Tiempo</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Estado</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Intentos</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {examenes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                                        No hay exámenes registrados
                                    </td>
                                </tr>
                            ) : (
                                examenes.map(ex => (
                                    <tr key={ex.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{ex.titulo}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px', color: '#666' }}>{ex.descripcion || '—'}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{ex.categoria.nombre}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{ex.tiempo_limite_min ? `${ex.tiempo_limite_min} min` : 'Sin límite'}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                            {ex.publicado
                                                ? <span style={{ background: '#C6F6D5', color: '#276749', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Publicado</span>
                                                : <span style={{ background: '#E2E8F0', color: '#4A5568', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Borrador</span>}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{ex._count.intentos}</td>
                                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button onClick={() => navigate(`/admin/examenes/${ex.id}`)}
                                                style={{ padding: '0.3rem 0.7rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                                Preguntas
                                            </button>
                                            <button onClick={() => iniciarEdicion(ex)} disabled={ex._count.intentos > 0}
                                                style={{ padding: '0.3rem 0.7rem', background: ex._count.intentos > 0 ? '#E2E8F0' : '#ECC94B', color: ex._count.intentos > 0 ? '#999' : '#744210', border: 'none', borderRadius: '4px', cursor: ex._count.intentos > 0 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                                                Editar
                                            </button>
                                            <button onClick={() => handleEliminar(ex.id)} disabled={ex._count.intentos > 0}
                                                style={{ padding: '0.3rem 0.7rem', background: ex._count.intentos > 0 ? '#E2E8F0' : '#E53E3E', color: ex._count.intentos > 0 ? '#999' : 'white', border: 'none', borderRadius: '4px', cursor: ex._count.intentos > 0 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                                                Eliminar
                                            </button>
                                            <button onClick={() => handleTogglePublicado(ex.id)}
                                                style={{ padding: '0.3rem 0.7rem', background: ex.publicado ? '#718096' : '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                                {ex.publicado ? 'Despublicar' : 'Publicar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>
                )}
            </div>
        </div>
    );
};

export default ExamenesPage;