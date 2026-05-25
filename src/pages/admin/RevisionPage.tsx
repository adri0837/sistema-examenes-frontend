import { useState } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';

const pendientesEjemplo = [
    {
        id: 'r1', estudiante: 'Juan Pérez', examen: 'Examen de Matemáticas', fecha: '2024-03-10',
        respuestas_abiertas: [
            { id: 'ra1', enunciado: 'Explica el teorema de Pitágoras.', respuesta: 'Es la relación entre los lados de un triángulo rectángulo donde a² + b² = c².', puntaje_max: 20, puntaje_asignado: null },
        ]
    },
    {
        id: 'r2', estudiante: 'María López', examen: 'Examen de Ciencias', fecha: '2024-03-11',
        respuestas_abiertas: [
            { id: 'ra2', enunciado: 'Describe el ciclo del agua.', respuesta: 'El agua se evapora, forma nubes y llueve de nuevo.', puntaje_max: 15, puntaje_asignado: null },
        ]
    },
];

const RevisionPage = () => {
    const [puntajes, setPuntajes] = useState<Record<string, string>>({});
    const [expandido, setExpandido] = useState<string | null>(null);

    const handlePuntaje = (respuestaId: string, valor: string) => {
        setPuntajes(prev => ({ ...prev, [respuestaId]: valor }));
    };

    const handleCalificar = (respuestaId: string) => {
        console.log('Calificar respuesta:', respuestaId, 'con puntaje:', puntajes[respuestaId]);
    };

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h2>Revisión de Respuestas Abiertas</h2>
                <p style={{ color: '#666', fontSize: '14px' }}>Intentos pendientes de calificación: {pendientesEjemplo.length}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    {pendientesEjemplo.map(intento => (
                        <div key={intento.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ padding: '0.75rem 1rem', background: '#F7FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => setExpandido(expandido === intento.id ? null : intento.id)}>
                                <div>
                                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{intento.estudiante}</span>
                                    <span style={{ color: '#666', fontSize: '13px', marginLeft: '1rem' }}>{intento.examen}</span>
                                    <span style={{ color: '#999', fontSize: '12px', marginLeft: '1rem' }}>{intento.fecha}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ background: '#FEFCBF', color: '#744210', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>
                                        {intento.respuestas_abiertas.length} pendiente(s)
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#666' }}>{expandido === intento.id ? '▲ Cerrar' : '▼ Revisar'}</span>
                                </div>
                            </div>

                            {expandido === intento.id && (
                                <div style={{ padding: '1rem' }}>
                                    {intento.respuestas_abiertas.map(ra => (
                                        <div key={ra.id} style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem' }}>
                                            <p style={{ fontWeight: '500', fontSize: '14px', margin: '0 0 0.5rem' }}>Pregunta: {ra.enunciado}</p>
                                            <div style={{ background: '#F7FAFC', padding: '0.75rem', borderRadius: '4px', fontSize: '14px', color: '#2D3748', marginBottom: '0.75rem' }}>
                                                {ra.respuesta}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <label style={{ fontSize: '13px' }}>Puntaje (máx. {ra.puntaje_max}):</label>
                                                <input type="number" min={0} max={ra.puntaje_max}
                                                    value={puntajes[ra.id] || ''}
                                                    onChange={e => handlePuntaje(ra.id, e.target.value)}
                                                    style={{ padding: '0.3rem 0.5rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '80px' }} />
                                                <button onClick={() => handleCalificar(ra.id)}
                                                    style={{ padding: '0.3rem 0.8rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RevisionPage;