import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';

// Datos de prueba — se reemplazarán con llamadas al backend
const calificacionesEjemplo = [
    { id: '1', titulo: 'Examen de Historia', categoria: 'Historia', calificacion: 85, fecha: '2024-03-10', estado: 'CALIFICADO' },
    { id: '2', titulo: 'Examen de Ciencias', categoria: 'Ciencias', calificacion: null, fecha: '2024-03-12', estado: 'ENTREGADO' },
];

const CalificacionesPage = () => {
    return (
        <div>
            <NavbarEstudiante />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h2>Mis Calificaciones</h2>

                {calificacionesEjemplo.length === 0 ? (
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
                            {calificacionesEjemplo.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{item.titulo}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{item.categoria}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>{item.fecha}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                        {item.estado === 'CALIFICADO'
                                            ? <span style={{ fontWeight: 'bold', color: '#276749' }}>{item.calificacion} / 100</span>
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