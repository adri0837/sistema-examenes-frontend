import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import './LoginPage.css';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError('Ingresa tu correo y contraseña');
            return;
        }
        try {
            setCargando(true);
            setError('');
            const { data } = await api.post('/auth/login', { email, password });
            login(data.usuario, data.token);
            navigate(data.usuario.rol === 'ADMIN' ? '/admin' : '/estudiante');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Sistema de Exámenes</h2>
                    <p>Inicia sesión para continuar</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Correo Electrónico</label>
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="btn-submit" disabled={cargando}>
                        {cargando ? 'Ingresando...' : 'Entrar a la Plataforma'}
                    </button>
                </form>

                <p className="login-footer">
                    ¿No tienes cuenta? <Link to="/registro">Regístrate como estudiante</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
