import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';
import './Admin.css';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface Categoria { id: string; nombre: string; }
interface Examen {
    id: string; titulo: string; descripcion: string | null;
    categoria: Categoria;
    publicado: boolean; supervision_activa: boolean; _count: { intentos: number };
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
    const [supervisionActiva, setSupervisionActiva] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [dialog, setDialog] = useState<{ mensaje: string; onConfirmar: () => void } | null>(null);

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
        setTitulo(''); setDescripcion(''); setCategoriaId(''); setSupervisionActiva(false);
        setMostrarForm(false); setEditando(null);
    };

    const handleCrear = async () => {
        try {
            setError('');
            await api.post('/examenes', { titulo, descripcion, categoria_id, supervision_activa: supervisionActiva });
            limpiarForm(); cargarDatos();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al crear examen');
        }
    };

    const handleEditar = async () => {
        if (!editando) return;
        try {
            setError('');
            await api.put(`/examenes/${editando.id}`, { titulo, descripcion, categoria_id, supervision_activa: supervisionActiva });
            limpiarForm(); cargarDatos();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al editar examen');
        }
    };

    const handleEliminar = (ex: Examen) => {
        const tieneIntentos = ex._count.intentos > 0;
        setDialog({
            mensaje: tieneIntentos
                ? `Este examen tiene ${ex._count.intentos} intento(s) de estudiantes. ¿Eliminar también los intentos y todas las preguntas? Esta acción no se puede deshacer.`
                : '¿Eliminar este examen y todas sus preguntas? Esta acción no se puede deshacer.',
            onConfirmar: async () => {
                setDialog(null);
                try {
                    setError('');
                    await api.delete(`/examenes/${ex.id}`);
                    cargarDatos();
                } catch (e: any) {
                    setError(e.response?.data?.message || 'Error al eliminar examen');
                }
            }
        });
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
        setSupervisionActiva(ex.supervision_activa);
        setMostrarForm(false);
    };

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Gestión de Exámenes</h2>
                        <button onClick={() => { limpiarForm(); setMostrarForm(!mostrarForm); }} className="btn-primary">
                            {mostrarForm ? 'Cancelar' : '+ Nuevo examen'}
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
                                <label>Título del examen</label>
                                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej. Examen Parcial 1" />
                            </div>
                            <div className="admin-form-group">
                                <label>Descripción</label>
                                <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Instrucciones breves..." />
                            </div>
                            <div className="admin-form-group">
                                <label>Categoría</label>
                                <select value={categoria_id} onChange={e => setCategoriaId(e.target.value)}>
                                    <option value="">Seleccionar...</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontWeight: 500, color: '#1a1a1a' }}>
                                    <input type="checkbox" checked={supervisionActiva}
                                        onChange={e => setSupervisionActiva(e.target.checked)}
                                        style={{ accentColor: '#16a34a', transform: 'scale(1.2)' }} />
                                    Activar supervisión (cámara + micrófono + monitoreo)
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={editando ? handleEditar : handleCrear} className="btn-primary">
                                    {editando ? 'Guardar cambios' : 'Crear examen'}
                                </button>
                                {editando && (
                                    <button onClick={limpiarForm} className="action-btn">Cancelar</button>
                                )}
                            </div>
                        </div>
                    )}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando exámenes...</p> : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Descripción</th>
                                        <th>Categoría</th>
                                        <th>Estado</th>
                                        <th>Supervisión</th>
                                        <th>Intentos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {examenes.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>
                                                No hay exámenes registrados
                                            </td>
                                        </tr>
                                    ) : (
                                        examenes.map(ex => (
                                            <tr key={ex.id}>
                                                <td style={{ fontWeight: 500 }}>{ex.titulo}</td>
                                                <td style={{ color: '#6b7280' }}>{ex.descripcion || '—'}</td>
                                                <td>
                                                    <span className="badge badge-info">{ex.categoria.nombre}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${ex.publicado ? 'badge-active' : 'badge-inactive'}`}>
                                                        {ex.publicado ? 'Publicado' : 'Borrador'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {ex.supervision_activa
                                                        ? <span className="badge badge-warning">📷 Activa</span>
                                                        : <span className="badge badge-inactive">—</span>}
                                                </td>
                                                <td style={{ textAlign: 'center', color: '#6b7280' }}>{ex._count.intentos}</td>
                                                <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button onClick={() => navigate(`/admin/examenes/${ex.id}`)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
                                                        Preguntas
                                                    </button>
                                                    <button onClick={() => iniciarEdicion(ex)}
                                                        className="action-btn">
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleEliminar(ex)}
                                                        className="action-btn btn-danger">
                                                        Eliminar
                                                    </button>
                                                    <button onClick={() => handleTogglePublicado(ex.id)}
                                                        className={`action-btn ${ex.publicado ? '' : 'btn-success'}`}>
                                                        {ex.publicado ? 'Despublicar' : 'Publicar'}
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

export default ExamenesPage;
