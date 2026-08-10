import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';

interface DatoGrafico {
    nombre: string;
    calificacion: number;
}

interface Props {
    datos: DatoGrafico[];
    titulo: string;
}

const COLOR_BASE = '#86b7a3';
const COLOR_DESTACADA = '#16a34a';
const COLOR_TICKS = '#6b7280';

const GraficoCalificaciones: React.FC<Props> = ({ datos, titulo }) => {
    if (datos.length === 0) {
        return (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem', background: '#faf9f6', borderRadius: '10px', border: '1px dashed #e8e5de' }}>
                No hay calificaciones para graficar
            </p>
        );
    }

    const mayor = Math.max(...datos.map(d => d.calificacion));

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', color: '#1a1a1a', margin: '0 0 0.5rem', fontWeight: 700 }}>
                {titulo}
            </h4>
            <div style={{ width: '100%', height: 300, background: '#fff', border: '1px solid #e8e5de', borderRadius: '10px', padding: '1rem 0.5rem 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datos} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0eee9" />
                        <XAxis
                            dataKey="nombre"
                            tick={{ fill: COLOR_TICKS, fontSize: 12 }}
                            interval={0}
                            tickFormatter={(v) => (String(v).length > 18 ? `${String(v).slice(0, 17)}…` : String(v))}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: COLOR_TICKS, fontSize: 12 }}
                            width={40}
                        />
                        <Tooltip
                            formatter={(value) => [`${Number(value)} / 100`, 'Calificación']}
                            contentStyle={{ borderRadius: 8, border: '1px solid #e8e5de', fontSize: '0.85rem' }}
                        />
                        <Bar dataKey="calificacion" name="Calificación" radius={[6, 6, 0, 0]}>
                            {datos.map((d, i) => (
                                <Cell key={i} fill={d.calificacion === mayor ? COLOR_DESTACADA : COLOR_BASE} />
                            ))}
                            <LabelList
                                dataKey="calificacion"
                                position="top"
                                formatter={(v) => String(Math.round(Number(v) * 100) / 100)}
                                style={{ fill: '#1a1a1a', fontSize: 11, fontWeight: 700 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
                La barra en <span style={{ color: COLOR_DESTACADA, fontWeight: 700 }}>verde</span> es la calificación más alta.
            </p>
        </div>
    );
};

export default GraficoCalificaciones;
