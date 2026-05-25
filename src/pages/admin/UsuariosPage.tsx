import { useState } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';

const usuariosEjemplo = [
    { id: '1', nombre: 'Juan Pérez', email: 'juan@mail.com', activo: true, creado_en: '2024-03-01' },
    { id: '2', nombre: 'María López', email: 'maria@mail.com', activo: true, creado_en: '2024-03-05' },
    { id: '3', nombre: 'Carlos Ruiz', email: 'carlos@mail.com', activo: false, creado_en: '2024-03-08' },
];

const UsuariosPage = () => {
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleCrear = () => {
        // Aquí se llamará al backend
        console.log({ nombre, email, password });
        setMostrarForm(false);
        setNombre(''); setEmail(''); setPassword('');
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
                        {usuariosEjemplo.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{u.nombre}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{u.email}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{u.creado_en}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                    {u.activo
                                        ? <span style={{ background: '#C6F6D5', color: '#276749', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Activo</span>
                                        : <span style={{ background: '#FED7D7', color: '#9B2C2C', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Inactivo</span>
                                    }
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <button style={{ padding: '0.3rem 0.7rem', background: u.activo ? '#E53E3E' : '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        {u.activo ? 'Desactivar' : 'Activar'}
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

export default UsuariosPage;