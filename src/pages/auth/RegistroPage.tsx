import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const RegistroPage = () => {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);

    const handleRegistro = async () => {
        try {
            setError('');
            await api.post('/auth/registro', { nombre, email, password });
            setExito(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al registrarse');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                <h2 style={{ textAlign: 'center' }}>Crear cuenta</h2>

                {exito ? (
                    <p style={{ color: 'green', textAlign: 'center' }}>✅ Cuenta creada correctamente. Redirigiendo al login...</p>
                ) : (
                    <>
                        <input placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)}
                            style={{ padding: '0.5rem', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                            style={{ padding: '0.5rem', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
                            style={{ padding: '0.5rem', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        {error && <p style={{ color: 'red', fontSize: '13px', margin: 0 }}>{error}</p>}
                        <button onClick={handleRegistro}
                            style={{ padding: '0.6rem', backgroundColor: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            Registrarse
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
                            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default RegistroPage;