import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            setError('');
            const { data } = await api.post('/auth/login', { email, password });
            login(data.usuario, data.token);
            navigate(data.usuario.rol === 'ADMIN' ? '/admin' : '/estudiante');
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                <h2 style={{ textAlign: 'center' }}>Iniciar Sesión</h2>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                    style={{ padding: '0.5rem', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
                    style={{ padding: '0.5rem', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }} />
                {error && <p style={{ color: 'red', fontSize: '13px', margin: 0 }}>{error}</p>}
                <button onClick={handleLogin}
                    style={{ padding: '0.6rem', backgroundColor: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                    Entrar
                </button>
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
                    ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
                </p>
            </div>
        </div>

    );
};

export default LoginPage;