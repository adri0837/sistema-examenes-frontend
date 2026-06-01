import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';
import './Admin.css';

interface Usuario {
    id: string;
    nombre: string;
    email: string;
    activo: boolean;
    creado_en: string;
}

const UsuariosPage = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    const cargarUsuarios = async () => {
        try {
            const { data } = await api.get('/usuarios');
            setUsuarios(data);
        } catch {
            setError('Error al cargar usuarios');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarUsuarios(); }, []);

    const handleCrear = async () => {
        try {
            setError('');
            await api.post('/usuarios', { nombre, email, password });
            setMostrarForm(false);
            setNombre(''); setEmail(''); setPassword('');
            cargarUsuarios();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al crear usuario');
        }
    };

    const handleToggleActivo = async (id: string) => {
        try {
            setError('');
            await api.patch(`/usuarios/${id}/toggle-activo`);
            cargarUsuarios();
        } catch {
            setError('Error al actualizar usuario');
        }
    };

    const handleEliminar = async (id: string) => {
        if (!window.confirm('¿Eliminar permanentemente este estudiante?')) return;
        try {
            setError('');
            await api.delete(`/usuarios/${id}`);
            cargarUsuarios();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al eliminar usuario');
        }
    };

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Gestión de Usuarios</h2>
                        <button onClick={() => setMostrarForm(!mostrarForm)} className="btn-primary">
                            {mostrarForm ? 'Cancelar' : '+ Nuevo estudiante'}
                        </button>
                    </div>

                    {error && (
                        <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                            {error}
                        </p>
                    )}

                    {mostrarForm && (
                        <div className="admin-form-card">
                            <div className="admin-form-group">
                                <label>Nombre completo</label>
                                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Juan Pérez" />
                            </div>
                            <div className="admin-form-group">
                                <label>Email</label>
                                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@ejemplo.com" />
                            </div>
                            <div className="admin-form-group">
                                <label>Contraseña</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <button onClick={handleCrear} className="btn-primary">
                                Guardar estudiante
                            </button>
                        </div>
                    )}

                    {cargando ? <p style={{ color: '#6b7280' }}>Cargando usuarios...</p> : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Fecha de registro</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>
                                                No hay estudiantes registrados
                                            </td>
                                        </tr>
                                    ) : (
                                        usuarios.map(u => (
                                            <tr key={u.id}>
                                                <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                                                <td style={{ color: '#6b7280' }}>{u.email}</td>
                                                <td style={{ color: '#6b7280' }}>{new Date(u.creado_en).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`badge ${u.activo ? 'badge-active' : 'badge-inactive'}`}>
                                                        {u.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleToggleActivo(u.id)}
                                                        className={`action-btn ${u.activo ? 'btn-danger' : 'btn-success'}`}>
                                                        {u.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    {!u.activo && (
                                                        <button onClick={() => handleEliminar(u.id)}
                                                            className="action-btn btn-danger">
                                                            Eliminar
                                                        </button>
                                                    )}
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
        </div>
    );
};

export default UsuariosPage;