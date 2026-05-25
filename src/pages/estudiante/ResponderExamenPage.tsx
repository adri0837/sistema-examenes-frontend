import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarEstudiante from '../../components/estudiante/NavbarEstudiante';

// Datos de prueba — se reemplazarán con llamadas al backend
const examenEjemplo = {
    id: '1',
    titulo: 'Examen de Matemáticas',
    tiempo_limite_min: 30,
    preguntas: [
        {
            id: 'p1', orden: 1, enunciado: '¿Cuánto es 2 + 2?', tipo: 'OPCION_MULTIPLE', puntaje: 10,
            opciones: [
                { id: 'o1', texto: '3' },
                { id: 'o2', texto: '4' },
                { id: 'o3', texto: '5' },
            ]
        },
        {
            id: 'p2', orden: 2, enunciado: 'La Tierra es plana.', tipo: 'VERDADERO_FALSO', puntaje: 10,
            opciones: [
                { id: 'o4', texto: 'Verdadero' },
                { id: 'o5', texto: 'Falso' },
            ]
        },
        {
            id: 'p3', orden: 3, enunciado: 'Explica el teorema de Pitágoras con tus palabras.', tipo: 'ABIERTA', puntaje: 20,
            opciones: []
        },
    ]
};

const ResponderExamenPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [respuestas, setRespuestas] = useState<Record<string, any>>({});
    const [entregado, setEntregado] = useState(false);

    const handleOpcion = (preguntaId: string, opcionId: string) => {
        setRespuestas(prev => ({ ...prev, [preguntaId]: opcionId }));
    };

    const handleTexto = (preguntaId: string, texto: string) => {
        setRespuestas(prev => ({ ...prev, [preguntaId]: texto }));
    };

    const handleEntregar = () => {
        // Aquí se llamará al backend
        setEntregado(true);
    };

    if (entregado) {
        return (
            <div>
                <NavbarEstudiante />
                <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
                    <h2>✅ Examen entregado</h2>
                    <p style={{ color: '#666' }}>Tu examen ha sido enviado correctamente. Podrás ver tu calificación una vez que sea revisado.</p>
                    <button onClick={() => navigate('/estudiante/calificaciones')}
                        style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Ver calificaciones
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <NavbarEstudiante />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
                <h2>{examenEjemplo.titulo}</h2>
                {examenEjemplo.tiempo_limite_min && (
                    <p style={{ color: '#E53E3E', fontSize: '14px' }}>⏱ Tiempo límite: {examenEjemplo.tiempo_limite_min} minutos</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                    {examenEjemplo.preguntas.map((pregunta, index) => (
                        <div key={pregunta.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
                            <p style={{ fontWeight: '500', margin: '0 0 0.25rem', fontSize: '14px', color: '#666' }}>
                                Pregunta {index + 1} — {pregunta.puntaje} pts
                            </p>
                            <p style={{ margin: '0 0 1rem', fontSize: '15px' }}>{pregunta.enunciado}</p>

                            {/* Opción múltiple y V/F */}
                            {(pregunta.tipo === 'OPCION_MULTIPLE' || pregunta.tipo === 'VERDADERO_FALSO') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {pregunta.opciones.map(opcion => (
                                        <label key={opcion.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>
                                            <input type="radio" name={pregunta.id} value={opcion.id}
                                                checked={respuestas[pregunta.id] === opcion.id}
                                                onChange={() => handleOpcion(pregunta.id, opcion.id)} />
                                            {opcion.texto}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Abierta */}
                            {pregunta.tipo === 'ABIERTA' && (
                                <textarea rows={4} placeholder="Escribe tu respuesta aquí..."
                                    value={respuestas[pregunta.id] || ''}
                                    onChange={e => handleTexto(pregunta.id, e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }} />
                            )}
                        </div>
                    ))}
                </div>

                <button onClick={handleEntregar}
                    style={{ marginTop: '2rem', padding: '0.75rem 2rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', width: '100%' }}>
                    Entregar examen
                </button>
            </div>
        </div>
    );
};

export default ResponderExamenPage;