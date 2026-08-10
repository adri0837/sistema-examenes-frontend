import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api, { obtenerMensajeError } from '../../api/axios';
import './Admin.css';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

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
    const [dialog, setDialog] = useState<{ mensaje: string; onConfirmar: () => void } | null>(null);

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
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al crear categoría'));
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
        } catch (e) {
            setError(obtenerMensajeError(e, 'Error al editar categoría'));
        }
    };

    const handleEliminar = (id: string) => {
        setDialog({
            mensaje: '¿Eliminar esta categoría? Solo es posible si no tiene exámenes asociados.',
            onConfirmar: async () => {
                setDialog(null);
                try {
                    setError('');
                    await api.delete(`/categorias/${id}`);
                    cargarCategorias();
                } catch (e) {
                    setError(obtenerMensajeError(e, 'Error al eliminar categoría'));
                }
            }
        });
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
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Gestión de Categorías</h2>
                        <button onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); setNombre(''); setDescripcion(''); }} className="btn-primary">
                            {mostrarForm ? 'Cancelar' : '+ Nueva categoría'}
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
                                <label>Nombre de la categoría</label>
                                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Matemáticas" />
                            </div>
                            <div className="admin-form-group">
                                <label>Descripción (opcional)</label>
                                <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Breve descripción..." />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={editando ? handleEditar : handleCrear} className="btn-primary">
                                    {editando ? 'Guardar cambios' : 'Crear categoría'}
                                </button>
                                {editando && (
                                    <button onClick={cancelar} className="action-btn">
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando categorías...</p> : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Exámenes asociados</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categorias.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>
                                                No hay categorías registradas
                                            </td>
                                        </tr>
                                    ) : (
                                        categorias.map(c => (
                                            <tr key={c.id}>
                                                <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                                                <td style={{ color: '#6b7280' }}>{c.descripcion || '—'}</td>
                                                <td>
                                                    <span className="badge badge-info">
                                                        {c._count.examenes} examen(es)
                                                    </span>
                                                </td>
                                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => iniciarEdicion(c)} className="action-btn">
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleEliminar(c.id)} disabled={c._count.examenes > 0}
                                                        className="action-btn btn-danger"
                                                        style={{ opacity: c._count.examenes > 0 ? 0.4 : 1, cursor: c._count.examenes > 0 ? 'not-allowed' : 'pointer' }}>
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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

export default CategoriasPage;
