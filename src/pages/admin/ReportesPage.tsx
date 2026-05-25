import { useState } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';

const reporteExamenEjemplo = [
    { estudiante: 'Juan Pérez', calificacion: 85, fecha: '2024-03-10', estado: 'CALIFICADO' },
    { estudiante: 'María López', calificacion: null, fecha: '2024-03-11', estado: 'ENTREGADO' },
    { estudiante: 'Carlos Ruiz', calificacion: 92, fecha: '2024-03-12', estado: 'CALIFICADO' },
];

const reporteEstudianteEjemplo = [
    { examen: 'Matemáticas', calificacion: 85, fecha: '2024-03-10', estado: 'CALIFICADO' },
    { examen: 'Historia', calificacion: 90, fecha: '2024-03-11', estado: 'CALIFICADO' },
    { examen: 'Ciencias', calificacion: null, fecha: '2024-03-12', estado: 'ENTREGADO' },
];

const ReportesPage = () => {
    const [tipoReporte, setTipoReporte] = useState<'examen' | 'estudiante'>('examen');

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Reportes</h2>
                    <button style={{ padding: '0.5rem 1rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        Exportar CSV
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                    <button onClick={() => setTipoReporte('examen')}
                        style={{ padding: '0.4rem 1rem', background: tipoReporte === 'examen' ? '#534AB7' : '#E2E8F0', color: tipoReporte === 'examen' ? 'white' : '#4A5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        Por examen
                    </button>
                    <button onClick={() => setTipoReporte('estudiante')}
                        style={{ padding: '0.4rem 1rem', background: tipoReporte === 'estudiante' ? '#534AB7' : '#E2E8F0', color: tipoReporte === 'estudiante' ? 'white' : '#4A5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        Por estudiante
                    </button>
                </div>

                {tipoReporte === 'examen' && (
                    <div>
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label style={{ fontSize: '13px' }}>Seleccionar examen:</label>
                            <select style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                                <option>Examen de Matemáticas</option>
                                <option>Examen de Historia</option>
                            </select>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Estudiante</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Fecha</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Calificación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reporteExamenEjemplo.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{r.estudiante}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{r.fecha}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                            {r.estado === 'CALIFICADO'
                                                ? <span style={{ fontWeight: 'bold', color: '#276749' }}>{r.calificacion} / 100</span>
                                                : <span style={{ background: '#FEFCBF', color: '#744210', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>En revisión</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tipoReporte === 'estudiante' && (
                    <div>
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label style={{ fontSize: '13px' }}>Seleccionar estudiante:</label>
                            <select style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                                <option>Juan Pérez</option>
                                <option>María López</option>
                            </select>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Examen</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Fecha</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>Calificación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reporteEstudianteEjemplo.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{r.examen}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>{r.fecha}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                            {r.estado === 'CALIFICADO'
                                                ? <span style={{ fontWeight: 'bold', color: '#276749' }}>{r.calificacion} / 100</span>
                                                : <span style={{ background: '#FEFCBF', color: '#744210', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>En revisión</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportesPage;