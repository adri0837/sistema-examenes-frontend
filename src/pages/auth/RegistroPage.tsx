import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import './LoginPage.css';

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
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Crear Cuenta</h2>
                    <p>Únete como estudiante o docente</p>
                </div>

                {exito ? (
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(46, 204, 113, 0.2)', borderRadius: '10px', border: '1px solid rgba(46, 204, 113, 0.4)' }}>
                        <p style={{ color: '#2ecc71', margin: 0, fontWeight: 600 }}>✅ Cuenta creada correctamente.</p>
                        <p style={{ color: '#a8c0ff', fontSize: '0.85rem', marginTop: '0.5rem' }}>Redirigiendo al login...</p>
                    </div>
                ) : (
                    <>
                        <div className="input-group">
                            <label>Nombre Completo</label>
                            <input 
                                placeholder="Tu nombre" 
                                value={nombre} 
                                onChange={e => setNombre(e.target.value)} 
                            />
                        </div>
                        
                        <div className="input-group">
                            <label>Correo Electrónico</label>
                            <input 
                                type="email" 
                                placeholder="tu@email.com" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                            />
                        </div>
                        
                        <div className="input-group">
                            <label>Contraseña</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                            />
                        </div>
                        
                        {error && <p className="error-message">{error}</p>}
                        
                        <button onClick={handleRegistro} className="btn-submit">
                            Registrarse
                        </button>
                        
                        <p className="login-footer">
                            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default RegistroPage;