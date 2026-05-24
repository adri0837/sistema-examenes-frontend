// Esto es solo un ejemplo para la conexión con el backend

import { useEffect, useState } from 'react';

function App() {
  const [mensaje, setMensaje] = useState<string>('Cargando...');

  useEffect(() => {
    fetch('http://localhost:3000/api/ping')
      .then(res => res.json())
      .then(data => setMensaje(data.message))
      .catch(() => setMensaje('❌ Error: no se pudo conectar al backend'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Prueba de conexión</h1>
      <p>Respuesta del backend:</p>
      <strong>{mensaje}</strong>
    </div>
  );
}

export default App;