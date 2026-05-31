export const PUNTAJE_MAXIMO = 100;

export const limitarCalificacion = (puntaje: number | string | null | undefined): number => {
    const num = Number(puntaje ?? 0);
    if (Number.isNaN(num)) return 0;
    return Math.min(Math.max(0, num), PUNTAJE_MAXIMO);
};

export const formatearCalificacion = (puntaje: number | string | null | undefined): string =>
    `${limitarCalificacion(puntaje)} / ${PUNTAJE_MAXIMO}`;
