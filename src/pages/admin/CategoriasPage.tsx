import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';

interface Categoria {
    id: string;
    nombre: string;
    descripcion: string | null;
    _count: { examenes: number };
}

const CategoriasPage = () => {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState<Categoria | null>(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    const cargarCategorias = async () => {
        try {
            const { data } = await api.get('/categorias');
            setCategorias(data);
        } catch {
            setError('Error al cargar categorías');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarCategorias(); }, []);

    const handleCrear = async () => {
        try {
            setError('');
            await api.post('/categorias', { nombre, descripcion });
            setMostrarForm(false);
            setNombre(''); setDescripcion('');
            cargarCategorias();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al crear categoría');
        }
    };

    const handleEditar = async () => {
        if (!editando) return;
        try {
            setError('');
            await api.put(`/categorias/${editando.id}`, { nombre, descripcion });
            setEditando(null);
            setNombre(''); setDescripcion('');
            cargarCategorias();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al editar categoría');
        }
    };

    const handleEliminar = async (id: string) => {
        try {
            setError('');
            await api.delete(`/categorias/${id}`);
            cargarCategorias();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al eliminar categoría');
        }
    };

    const iniciarEdicion = (cat: Categoria) => {
        setEditando(cat);
        setNombre(cat.nombre);
        setDescripcion(cat.descripcion || '');
        setMostrarForm(false);
    };

    const cancelar = () => {
        setEditando(null);
        setMostrarForm(false);
        setNombre(''); setDescripcion('');
    };

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Gestión de Categorías</h2>
                    <button onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); setNombre(''); setDescripcion(''); }}
                        style={{ padding: '0.5rem 1rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        {mostrarForm ? 'Cancelar' : '+ Nueva categoría'}
                    </button>
                </div>

                {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '0.5rem' }}>{error}</p>}

                {(mostrarForm || editando) && (
                    <div style={{ marginTop: '1rem', padding: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Nombre</label>
                            <input value={nombre} onChange={e => setNombre(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Descripción (opcional)</label>
                            <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '250px' }} />
                        </div>
                        <button onClick={editando ? handleEditar : handleCrear}
                            style={{ padding: '0.4rem 1rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            {editando ? 'Guardar cambios' : 'Crear'}
                        </button>
                        {editando && (
                            <button onClick={cancelar}
                                style={{ padding: '0.4rem 1rem', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                )}

                {cargando ? <p style={{ marginTop: '1rem', color: '#666' }}>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                        <thead>
                            <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Nombre</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Descripción</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Exámenes</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categorias.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                                        No hay categorías registradas
                                    </td>
                                </tr>
                            ) : (
                                categorias.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{c.nombre}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px', color: '#666' }}>{c.descripcion || '—'}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{c._count.examenes}</td>
                                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => iniciarEdicion(c)}
                                                style={{ padding: '0.3rem 0.7rem', background: '#ECC94B', color: '#744210', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                                Editar
                                            </button>
                                            <button onClick={() => handleEliminar(c.id)} disabled={c._count.examenes > 0}
                                                style={{ padding: '0.3rem 0.7rem', background: c._count.examenes > 0 ? '#E2E8F0' : '#E53E3E', color: c._count.examenes > 0 ? '#999' : 'white', border: 'none', borderRadius: '4px', cursor: c._count.examenes > 0 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                                                Eliminar
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

export default CategoriasPage;