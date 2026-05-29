import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';

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
            await api.patch(`/usuarios/${id}/toggle-activo`);
            cargarUsuarios();
        } catch {
            setError('Error al actualizar usuario');
        }
    };

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Gestión de Usuarios</h2>
                    <button onClick={() => setMostrarForm(!mostrarForm)}
                        style={{ padding: '0.5rem 1rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        {mostrarForm ? 'Cancelar' : '+ Nuevo estudiante'}
                    </button>
                </div>

                {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '0.5rem' }}>{error}</p>}

                {mostrarForm && (
                    <div style={{ marginTop: '1rem', padding: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Nombre</label>
                            <input value={nombre} onChange={e => setNombre(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Email</label>
                            <input value={email} onChange={e => setEmail(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Contraseña</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
                        </div>
                        <button onClick={handleCrear}
                            style={{ padding: '0.4rem 1rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            Crear
                        </button>
                    </div>
                )}

                {cargando ? <p style={{ marginTop: '1rem', color: '#666' }}>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                        <thead>
                            <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Nombre</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Email</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Fecha de registro</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Estado</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{u.nombre}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{u.email}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{new Date(u.creado_en).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                        {u.activo
                                            ? <span style={{ background: '#C6F6D5', color: '#276749', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Activo</span>
                                            : <span style={{ background: '#FED7D7', color: '#9B2C2C', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Inactivo</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <button onClick={() => handleToggleActivo(u.id)}
                                            style={{ padding: '0.3rem 0.7rem', background: u.activo ? '#E53E3E' : '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                            {u.activo ? 'Desactivar' : 'Activar'}
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

export default UsuariosPage;