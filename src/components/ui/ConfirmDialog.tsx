import React from 'react';

interface Props {
    mensaje: string;
    onConfirmar: () => void;
    onCancelar: () => void;
    textoConfirmar?: string;
    textoCancelar?: string;
    tipo?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<Props> = ({
    mensaje, onConfirmar, onCancelar,
    textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', tipo = 'danger'
}) => {
    const colores = {
        danger: { bg: '#fef2f2', border: '#fecaca', btn: '#dc2626', icon: '⚠️' },
        warning: { bg: '#fffbeb', border: '#fde68a', btn: '#d97706', icon: '⚠️' },
        info:    { bg: '#eff6ff', border: '#bfdbfe', btn: '#2563eb', icon: 'ℹ️' },
    }[tipo];

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px', padding: '2rem',
                maxWidth: '420px', width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                border: `1px solid ${colores.border}`,
                animation: 'dialogIn 0.18s ease'
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem', textAlign: 'center' }}>{colores.icon}</div>
                <p style={{ margin: '0 0 1.75rem', fontSize: '1rem', color: '#1a1a1a', textAlign: 'center', lineHeight: 1.6 }}>
                    {mensaje}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button onClick={onCancelar} style={{
                        padding: '0.65rem 1.5rem', borderRadius: '8px',
                        border: '1px solid #e8e5de', background: 'white',
                        color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
                    }}>
                        {textoCancelar}
                    </button>
                    <button onClick={onConfirmar} style={{
                        padding: '0.65rem 1.5rem', borderRadius: '8px', border: 'none',
                        background: colores.btn, color: 'white',
                        fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
                    }}>
                        {textoConfirmar}
                    </button>
                </div>
            </div>
            <style>{`@keyframes dialogIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }`}</style>
        </div>
    );
};

export default ConfirmDialog;
