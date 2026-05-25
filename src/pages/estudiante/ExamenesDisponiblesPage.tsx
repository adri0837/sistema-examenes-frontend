import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';
import { useNavigate } from 'react-router-dom';

// Datos de prueba — se reemplazarán con llamadas al backend
const examenesEjemplo = [
    { id: '1', titulo: 'Examen de Matemáticas', categoria: 'Matemáticas', tiempo_limite_min: 30, completado: false },
    { id: '2', titulo: 'Examen de Historia', categoria: 'Historia', tiempo_limite_min: null, completado: true },
    { id: '3', titulo: 'Examen de Ciencias', categoria: 'Ciencias', tiempo_limite_min: 45, completado: false },
];

const ExamenesDisponiblesPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <NavbarEstudiante />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h2>Exámenes Disponibles</h2>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Título</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Categoría</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Tiempo límite</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Estado</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {examenesEjemplo.map(examen => (
                            <tr key={examen.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{examen.titulo}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{examen.categoria}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{examen.tiempo_limite_min ? `${examen.tiempo_limite_min} min` : 'Sin límite'}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                    {examen.completado
                                        ? <span style={{ background: '#C6F6D5', color: '#276749', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Completado</span>
                                        : <span style={{ background: '#BEE3F8', color: '#2A69AC', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>Disponible</span>
                                    }
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    {examen.completado
                                        ? <span style={{ fontSize: '13px', color: '#999' }}>No disponible</span>
                                        : <button onClick={() => navigate(`/estudiante/examenes/${examen.id}`)}
                                            style={{ padding: '0.35rem 0.75rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                                            Iniciar
                                        </button>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExamenesDisponiblesPage;