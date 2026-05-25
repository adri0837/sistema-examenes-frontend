import { useState } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';

const categoriasEjemplo = [
    { id: '1', nombre: 'Matemáticas', descripcion: 'Álgebra, geometría y más', examenes: 3 },
    { id: '2', nombre: 'Historia', descripcion: 'Historia universal y de México', examenes: 1 },
    { id: '3', nombre: 'Ciencias', descripcion: 'Biología, física y química', examenes: 0 },
];

const CategoriasPage = () => {
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const handleCrear = () => {
        console.log({ nombre, descripcion });
        setMostrarForm(false);
        setNombre(''); setDescripcion('');
    };

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Gestión de Categorías</h2>
                    <button onClick={() => setMostrarForm(!mostrarForm)}
                        style={{ padding: '0.5rem 1rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        {mostrarForm ? 'Cancelar' : '+ Nueva categoría'}
                    </button>
                </div>

                {mostrarForm && (
                    <div style={{ marginTop: '1rem', padding: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Nombre</label>
                            <input value={nombre} onChange={e => setNombre(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Descripción (opcional)</label>
                            <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '250px' }} />
                        </div>
                        <button onClick={handleCrear}
                            style={{ padding: '0.4rem 1rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                            Crear
                        </button>
                    </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                    <thead>
                        <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Nombre</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Descripción</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Exámenes</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoriasEjemplo.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{c.nombre}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px', color: '#666' }}>{c.descripcion || '—'}</td>
                                <td style={{ padding: '0.75rem', fontSize: '14px' }}>{c.examenes}</td>
                                <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <button style={{ padding: '0.3rem 0.7rem', background: '#ECC94B', color: '#744210', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                        Editar
                                    </button>
                                    <button disabled={c.examenes > 0}
                                        style={{ padding: '0.3rem 0.7rem', background: c.examenes > 0 ? '#E2E8F0' : '#E53E3E', color: c.examenes > 0 ? '#999' : 'white', border: 'none', borderRadius: '4px', cursor: c.examenes > 0 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoriasPage;