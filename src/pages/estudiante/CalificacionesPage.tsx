import { useState, useEffect } from 'react';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import api from '../../api/axios';

interface Intento {
    id: string;
    estado: string;
    calificacion_final: number | null;
    entregado_en: string;
    examen: {
        titulo: string;
        descripcion: string | null;
        categoria: { nombre: string };
    };
}

const CalificacionesPage = () => {
    const [calificaciones, setCalificaciones] = useState<Intento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            try {
                const { data } = await api.get('/estudiante/calificaciones');
                setCalificaciones(data);
            } catch (e: any) {
                setError(e.response?.data?.message || e.message || 'Error al cargar calificaciones');
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    return (
        <div>
            <NavbarEstudiante />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h2>Mis Calificaciones</h2>
                {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

                {cargando ? <p style={{ color: '#666' }}>Cargando...</p> : calificaciones.length === 0 ? (
                    <p style={{ color: '#666', marginTop: '1rem' }}>Aún no has completado ningún examen.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Examen</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Categoría</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Fecha</th>
                                <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Calificación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calificaciones.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{item.examen.titulo}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{item.examen.categoria.nombre}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{new Date(item.entregado_en).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                        {item.estado === 'CALIFICADO'
                                            ? <span style={{ fontWeight: 'bold', color: '#276749' }}>{item.calificacion_final}</span>
                                            : <span style={{ background: '#FEFCBF', color: '#744210', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>En revisión</span>
                                        }
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

export default CalificacionesPage;