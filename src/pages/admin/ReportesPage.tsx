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
    estudiante?: { id: string; nombre: string; email: string; };
    examen?: { id: string; titulo: string; descripcion: string | null; categoria: { nombre: string }; };
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

    const darOportunidad = async (estudiante_id: string, examen_id: string) => {
        if (!window.confirm('¿Dar una nueva oportunidad a este estudiante? Su intento anterior será eliminado.')) return;
        try {
            setError('');
            await api.delete(`/admin/estudiantes/${estudiante_id}/examenes/${examen_id}/oportunidad`);
            cargarReporte();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Error al dar oportunidad');
        }
    };

    const getTitulo = (): string => {
        if (!reporte) return '';
        return tipoReporte === 'examen'
            ? `Reporte — ${reporte.examen.titulo} (${reporte.examen.categoria.nombre})`
            : `Reporte — ${reporte.estudiante.nombre} (${reporte.estudiante.email})`;
    };

    const getColumnas = () =>
        tipoReporte === 'examen'
            ? ['Estudiante', 'Email', 'Fecha de Entrega', 'Calificación', 'Acciones']
            : ['Examen', 'Categoría', 'Fecha de Entrega', 'Calificación'];

    const getColumnasCSV = () =>
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

    const exportarCSV = () => {
        if (!reporte) return;
        const columnas = getColumnasCSV();
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

    const exportarPDF = () => {
        if (!reporte) return;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(getTitulo(), 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 25);
        autoTable(doc, {
            head: [getColumnasCSV()],
            body: getFilas(),
            startY: 30,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 163, 74] },
        });
        doc.save(`reporte_${tipoReporte}_${Date.now()}.pdf`);
    };

    return (
        <div className="admin-layout">
            <div className="admin-content-wrapper">
                <NavbarAdmin />

                <div className="admin-page-container">
                    <div className="admin-header-flex">
                        <h2>Reportes</h2>
                    </div>

                    {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '1rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '6px', border: '1px solid #fecaca' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f7f6f2', padding: '0.4rem', borderRadius: '8px', width: 'fit-content', border: '1px solid #e8e5de' }}>
                        <button
                            onClick={() => { setTipoReporte('examen'); setReporte(null); setError(''); }}
                            className={tipoReporte === 'examen' ? 'btn-primary' : 'action-btn'}
                            style={{ padding: '0.5rem 1.1rem', border: 'none' }}>
                            Por examen
                        </button>
                        <button
                            onClick={() => { setTipoReporte('estudiante'); setReporte(null); setError(''); }}
                            className={tipoReporte === 'estudiante' ? 'btn-primary' : 'action-btn'}
                            style={{ padding: '0.5rem 1.1rem', border: 'none' }}>
                            Por estudiante
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        {tipoReporte === 'examen' ? (
                            <select value={examenSeleccionado} onChange={e => setExamenSeleccionado(e.target.value)}
                                style={{ padding: '0.65rem 0.9rem', background: '#f7f6f2', border: '1px solid #e8e5de', borderRadius: '6px', color: '#1a1a1a', fontSize: '0.95rem', minWidth: '300px', outline: 'none' }}>
                                <option value="">Seleccionar examen...</option>
                                {examenes.map(ex => <option key={ex.id} value={ex.id}>{ex.titulo}</option>)}
                            </select>
                        ) : (
                            <select value={estudianteSeleccionado} onChange={e => setEstudianteSeleccionado(e.target.value)}
                                style={{ padding: '0.65rem 0.9rem', background: '#f7f6f2', border: '1px solid #e8e5de', borderRadius: '6px', color: '#1a1a1a', fontSize: '0.95rem', minWidth: '300px', outline: 'none' }}>
                                <option value="">Seleccionar estudiante...</option>
                                {estudiantes.map(est => <option key={est.id} value={est.id}>{est.nombre}</option>)}
                            </select>
                        )}
                        <button onClick={cargarReporte} className="btn-primary">
                            Generar reporte
                        </button>
                    </div>

                    {cargando && <p style={{ color: '#6b7280' }}>Cargando datos del reporte...</p>}

                    {reporte && !cargando && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', color: '#1a1a1a', margin: '0 0 0.25rem', fontWeight: 700 }}>
                                        {tipoReporte === 'examen' ? reporte.examen.titulo : reporte.estudiante.nombre}
                                    </h3>
                                    <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
                                        {tipoReporte === 'examen' ? reporte.examen.categoria.nombre : reporte.estudiante.email}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={exportarCSV} className="action-btn btn-success">
                                        Exportar CSV
                                    </button>
                                    <button onClick={exportarPDF} className="action-btn btn-danger">
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
                                                <td colSpan={tipoReporte === 'examen' ? 5 : 4} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                                                    No hay resultados para este reporte
                                                </td>
                                            </tr>
                                        ) : (
                                            reporte.intentos.map((intento: IntentoReporte) => (
                                                <tr key={intento.id}>
                                                    <td style={{ fontWeight: 500 }}>
                                                        {tipoReporte === 'examen' ? intento.estudiante?.nombre : intento.examen?.titulo}
                                                    </td>
                                                    <td style={{ color: '#6b7280' }}>
                                                        {tipoReporte === 'examen' ? intento.estudiante?.email : intento.examen?.categoria.nombre}
                                                    </td>
                                                    <td style={{ color: '#6b7280' }}>
                                                        {intento.entregado_en ? new Date(intento.entregado_en).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td>
                                                        {intento.estado === 'CALIFICADO'
                                                            ? <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1rem' }}>{formatearCalificacion(intento.calificacion_final)}</span>
                                                            : <span className="badge badge-warning">En revisión</span>
                                                        }
                                                    </td>
                                                    {tipoReporte === 'examen' && (
                                                        <td>
                                                            <button
                                                                onClick={() => darOportunidad(
                                                                    intento.estudiante?.id || estudianteSeleccionado,
                                                                    intento.examen?.id || examenSeleccionado
                                                                )}
                                                                className="action-btn"
                                                                style={{ fontSize: '0.8rem' }}>
                                                                Nueva oportunidad
                                                            </button>
                                                        </td>
                                                    )}
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