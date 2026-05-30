import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExamenResumen { id: string; titulo: string; categoria: { nombre: string }; }
interface EstudianteResumen { id: string; nombre: string; email: string; }
interface IntentoReporte {
    id: string; estado: string; calificacion_final: number | null;
    iniciado_en: string; entregado_en: string;
    estudiante?: { nombre: string; email: string; };
    examen?: { titulo: string; descripcion: string | null; categoria: { nombre: string }; };
}

const ReportesPage = () => {
    const [tipoReporte, setTipoReporte] = useState<'examen' | 'estudiante'>('examen');
    const [examenes, setExamenes] = useState<ExamenResumen[]>([]);
    const [estudiantes, setEstudiantes] = useState<EstudianteResumen[]>([]);
    const [examenSeleccionado, setExamenSeleccionado] = useState('');
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('');
    const [reporte, setReporte] = useState<any>(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargar = async () => {
            try {
                const [exRes, estRes] = await Promise.all([
                    api.get('/reportes/examenes'),
                    api.get('/reportes/estudiantes'),
                ]);
                setExamenes(exRes.data);
                setEstudiantes(estRes.data);
            } catch {
                setError('Error al cargar datos');
            }
        };
        cargar();
    }, []);

    const cargarReporte = async () => {
        try {
            setError(''); setCargando(true); setReporte(null);
            if (tipoReporte === 'examen' && examenSeleccionado) {
                const { data } = await api.get(`/reportes/por-examen/${examenSeleccionado}`);
                setReporte(data);
            } else if (tipoReporte === 'estudiante' && estudianteSeleccionado) {
                const { data } = await api.get(`/reportes/por-estudiante/${estudianteSeleccionado}`);
                setReporte(data);
            } else {
                setError('Selecciona un elemento antes de ver el reporte');
            }
        } catch {
            setError('Error al cargar reporte');
        } finally {
            setCargando(false);
        }
    };

    // ── Helpers para obtener filas de la tabla ──────────────────────
    const getTitulo = (): string => {
        if (!reporte) return '';
        return tipoReporte === 'examen'
            ? `Reporte — ${reporte.examen.titulo} (${reporte.examen.categoria.nombre})`
            : `Reporte — ${reporte.estudiante.nombre} (${reporte.estudiante.email})`;
    };

    const getColumnas = () =>
        tipoReporte === 'examen'
            ? ['Estudiante', 'Email', 'Fecha', 'Calificación']
            : ['Examen', 'Categoría', 'Fecha', 'Calificación'];

    const getFilas = () =>
        reporte.intentos.map((intento: IntentoReporte) => [
            tipoReporte === 'examen'
                ? intento.estudiante?.nombre ?? '—'
                : intento.examen?.titulo ?? '—',
            tipoReporte === 'examen'
                ? intento.estudiante?.email ?? '—'
                : intento.examen?.categoria.nombre ?? '—',
            intento.entregado_en ? new Date(intento.entregado_en).toLocaleDateString() : '—',
            intento.estado === 'CALIFICADO'
                ? String(intento.calificacion_final)
                : 'En revisión',
        ]);

    // ── Exportar CSV ────────────────────────────────────────────────
    const exportarCSV = () => {
        if (!reporte) return;
        const columnas = getColumnas();
        const filas = getFilas();
        const contenido = [columnas, ...filas]
            .map(fila => fila.map((celda: string) => `"${celda}"`).join(','))
            .join('\n');
        const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_${tipoReporte}_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ── Exportar PDF ────────────────────────────────────────────────
    const exportarPDF = () => {
        if (!reporte) return;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(getTitulo(), 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 25);
        autoTable(doc, {
            head: [getColumnas()],
            body: getFilas(),
            startY: 30,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [83, 74, 183] },
        });
        doc.save(`reporte_${tipoReporte}_${Date.now()}.pdf`);
    };

    return (
        <div>
            <NavbarAdmin />
            <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
                <h2>Reportes</h2>
                {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                    <button onClick={() => { setTipoReporte('examen'); setReporte(null); setError(''); }}
                        style={{ padding: '0.4rem 1rem', background: tipoReporte === 'examen' ? '#534AB7' : '#E2E8F0', color: tipoReporte === 'examen' ? 'white' : '#4A5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        Por examen
                    </button>
                    <button onClick={() => { setTipoReporte('estudiante'); setReporte(null); setError(''); }}
                        style={{ padding: '0.4rem 1rem', background: tipoReporte === 'estudiante' ? '#534AB7' : '#E2E8F0', color: tipoReporte === 'estudiante' ? 'white' : '#4A5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        Por estudiante
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                    {tipoReporte === 'examen' ? (
                        <select value={examenSeleccionado} onChange={e => setExamenSeleccionado(e.target.value)}
                            style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                            <option value="">Seleccionar examen...</option>
                            {examenes.map(ex => <option key={ex.id} value={ex.id}>{ex.titulo}</option>)}
                        </select>
                    ) : (
                        <select value={estudianteSeleccionado} onChange={e => setEstudianteSeleccionado(e.target.value)}
                            style={{ padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}>
                            <option value="">Seleccionar estudiante...</option>
                            {estudiantes.map(est => <option key={est.id} value={est.id}>{est.nombre}</option>)}
                        </select>
                    )}
                    <button onClick={cargarReporte}
                        style={{ padding: '0.4rem 1rem', background: '#534AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                        Ver reporte
                    </button>
                </div>

                {cargando && <p style={{ color: '#666' }}>Cargando...</p>}

                {reporte && !cargando && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                                {tipoReporte === 'examen'
                                    ? <><strong>{reporte.examen.titulo}</strong> — {reporte.examen.categoria.nombre}</>
                                    : <><strong>{reporte.estudiante.nombre}</strong> — {reporte.estudiante.email}</>
                                }
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={exportarCSV}
                                    style={{ padding: '0.4rem 0.8rem', background: '#38A169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                                    Exportar CSV
                                </button>
                                <button onClick={exportarPDF}
                                    style={{ padding: '0.4rem 0.8rem', background: '#E53E3E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                                    Exportar PDF
                                </button>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F7FAFC', textAlign: 'left' }}>
                                    {getColumnas().map(col => (
                                        <th key={col} style={{ padding: '0.75rem', borderBottom: '2px solid #E2E8F0', fontSize: '13px' }}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reporte.intentos.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                                            No hay resultados para este reporte
                                        </td>
                                    </tr>
                                ) : (
                                    reporte.intentos.map((intento: IntentoReporte) => (
                                        <tr key={intento.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                                {tipoReporte === 'examen' ? intento.estudiante?.nombre : intento.examen?.titulo}
                                            </td>
                                            <td style={{ padding: '0.75rem', fontSize: '14px', color: '#666' }}>
                                                {tipoReporte === 'examen' ? intento.estudiante?.email : intento.examen?.categoria.nombre}
                                            </td>
                                            <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                                {intento.entregado_en ? new Date(intento.entregado_en).toLocaleDateString() : '—'}
                                            </td>
                                            <td style={{ padding: '0.75rem', fontSize: '14px' }}>
                                                {intento.estado === 'CALIFICADO'
                                                    ? <span style={{ fontWeight: 'bold', color: '#276749' }}>{intento.calificacion_final}</span>
                                                    : <span style={{ background: '#FEFCBF', color: '#744210', padding: '2px 8px', borderRadius: '99px', fontSize: '12px' }}>En revisión</span>
                                                }
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportesPage;