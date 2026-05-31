import { useState, useEffect } from 'react';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatearCalificacion, limitarCalificacion } from '../../utils/calificacion';
import './Admin.css';

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
            ? ['Estudiante', 'Email', 'Fecha de Entrega', 'Calificación']
            : ['Examen', 'Categoría', 'Fecha de Entrega', 'Calificación'];

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
                ? String(limitarCalificacion(intento.calificacion_final))
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
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />
                
                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Reportes y Analíticas</h2>
                    </div>

                    {error && <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '1rem' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.5rem', borderRadius: '12px', width: 'fit-content' }}>
                        <button onClick={() => { setTipoReporte('examen'); setReporte(null); setError(''); }}
                            className={tipoReporte === 'examen' ? 'btn-primary' : 'action-btn'}
                            style={{ padding: '0.6rem 1.2rem', background: tipoReporte === 'examen' ? '' : 'transparent', border: 'none', color: tipoReporte === 'examen' ? '' : '#94a3b8' }}>
                            Por examen
                        </button>
                        <button onClick={() => { setTipoReporte('estudiante'); setReporte(null); setError(''); }}
                            className={tipoReporte === 'estudiante' ? 'btn-primary' : 'action-btn'}
                            style={{ padding: '0.6rem 1.2rem', background: tipoReporte === 'estudiante' ? '' : 'transparent', border: 'none', color: tipoReporte === 'estudiante' ? '' : '#94a3b8' }}>
                            Por estudiante
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        {tipoReporte === 'examen' ? (
                            <select value={examenSeleccionado} onChange={e => setExamenSeleccionado(e.target.value)}
                                style={{ padding: '0.7rem 1rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: 'white', fontSize: '0.95rem', minWidth: '300px' }}>
                                <option value="" style={{ color: '#000' }}>Seleccionar examen...</option>
                                {examenes.map(ex => <option key={ex.id} value={ex.id} style={{ color: '#000' }}>{ex.titulo}</option>)}
                            </select>
                        ) : (
                            <select value={estudianteSeleccionado} onChange={e => setEstudianteSeleccionado(e.target.value)}
                                style={{ padding: '0.7rem 1rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: 'white', fontSize: '0.95rem', minWidth: '300px' }}>
                                <option value="" style={{ color: '#000' }}>Seleccionar estudiante...</option>
                                {estudiantes.map(est => <option key={est.id} value={est.id} style={{ color: '#000' }}>{est.nombre}</option>)}
                            </select>
                        )}
                        <button onClick={cargarReporte} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                            Generar reporte
                        </button>
                    </div>

                    {cargando && <p style={{ color: '#94a3b8' }}>Cargando datos del reporte...</p>}

                    {reporte && !cargando && (
                        <div className="admin-form-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.3rem', color: '#f8fafc', margin: '0 0 0.4rem' }}>
                                        {tipoReporte === 'examen' ? reporte.examen.titulo : reporte.estudiante.nombre}
                                    </h3>
                                    <p style={{ color: '#a8c0ff', margin: 0, fontSize: '0.95rem' }}>
                                        {tipoReporte === 'examen' ? reporte.examen.categoria.nombre : reporte.estudiante.email}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem' }}>
                                    <button onClick={exportarCSV} className="action-btn btn-success" style={{ padding: '0.6rem 1.2rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                        Exportar CSV
                                    </button>
                                    <button onClick={exportarPDF} className="action-btn btn-danger" style={{ padding: '0.6rem 1.2rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                        Exportar PDF
                                    </button>
                                </div>
                            </div>

                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            {getColumnas().map(col => (
                                                <th key={col}>{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reporte.intentos.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                                    No hay resultados para este reporte
                                                </td>
                                            </tr>
                                        ) : (
                                            reporte.intentos.map((intento: IntentoReporte) => (
                                                <tr key={intento.id}>
                                                    <td style={{ fontWeight: 500 }}>
                                                        {tipoReporte === 'examen' ? intento.estudiante?.nombre : intento.examen?.titulo}
                                                    </td>
                                                    <td style={{ color: '#94a3b8' }}>
                                                        {tipoReporte === 'examen' ? intento.estudiante?.email : intento.examen?.categoria.nombre}
                                                    </td>
                                                    <td>
                                                        {intento.entregado_en ? new Date(intento.entregado_en).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td>
                                                        {intento.estado === 'CALIFICADO'
                                                            ? <span style={{ fontWeight: 'bold', color: '#4ade80', fontSize: '1.05rem' }}>{formatearCalificacion(intento.calificacion_final)}</span>
                                                            : <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' }}>En revisión</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportesPage;