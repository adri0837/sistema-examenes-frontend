export const formatearCalificacion = (puntaje: number | string | null | undefined): string => {
    const num = Number(puntaje ?? 0);
    if (Number.isNaN(num)) return '0 / 100';
    const valor = Math.min(Math.max(0, Math.round(num * 100) / 100), 100);
    return `${valor} / 100`;
};

export const limitarCalificacion = (puntaje: number | string | null | undefined): number => {
    const num = Number(puntaje ?? 0);
    if (Number.isNaN(num)) return 0;
    return Math.min(Math.max(0, Math.round(num * 100) / 100), 100);
};