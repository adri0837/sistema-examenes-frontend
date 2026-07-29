export type Rol = 'ADMIN' | 'ESTUDIANTE';

export type TipoPregunta =
    | 'OPCION_MULTIPLE'
    | 'VERDADERO_FALSO'
    | 'ABIERTA'
    | 'RELACIONAR'
    | 'COMPLETAR';

export type EstadoIntento = 'EN_PROGRESO' | 'ENTREGADO' | 'CALIFICADO' | 'CANCELADO';

export interface Usuario {
    id: string;
    nombre: string;
    email: string;
    rol: Rol;
}

export interface AuthState {
    usuario: Usuario | null;
    token: string | null;
}

export interface UsuarioEstudiante {
    id: string;
    nombre: string;
    email: string;
    activo: boolean;
    creado_en: string;
}

export interface Categoria {
    id: string;
    nombre: string;
    descripcion?: string | null;
    _count?: { examenes: number };
}

export interface ExamenAdmin {
    id: string;
    titulo: string;
    descripcion: string | null;
    categoria: { id: string; nombre: string };
    publicado: boolean;
    _count: { intentos: number };
}

export interface IntentoResumen {
    id?: string;
    estado: EstadoIntento;
    calificacion_final: number | null;
}

export interface ExamenDisponible {
    id: string;
    titulo: string;
    descripcion: string | null;
    categoria: { nombre: string };
    _count: { preguntas: number };
    intento: IntentoResumen | null;
}

export interface RespuestaEntrega {
    pregunta_id: string;
    texto_respuesta?: string;
    opciones_seleccionadas?: string[];
    pares_relacionados?: { izquierdo: string; derecho: string }[];
    espacios_respuestas?: string[];
}

// ── Supervisión (Proctoring) ───────────────────────────────

export type IncidenteTipo =
    | 'SIN_CAMARA'
    | 'SIN_MICRO'
    | 'SIN_PERMISOS'
    | 'CAMBIO_VENTANA'
    | 'CIERRE_NAVEGADOR'
    | 'SALIR_PANTALLA_COMPLETA'
    | 'MOVIMIENTO_SOSPECHOSO'
    | 'RUIDO_SOSPECHOSO'
    | 'COPIA';

export interface IncidenteSupervision {
    id: string;
    intento_id: string;
    tipo: IncidenteTipo;
    descripcion?: string;
    creado_en: string;
}

export interface ProctoringState {
    permisoCamara: 'pending' | 'granted' | 'denied';
    permisoMicro: 'pending' | 'granted' | 'denied';
    fullscreenActivo: boolean;
    strikesRestantes: number;
    calibrando: boolean;
    calibracionProgreso: number;
    blurAdvertencias: number;
    error: string | null;
    /** 0.0-1.0 normalized pixel diff from baseline (live) */
    nivelMovimiento: number;
    /** 0.0-1.0 normalized audio RMS level (live) */
    nivelAudio: number;
}

export interface UseProctoringOptions {
    intentoId: string;
    supervisionActiva: boolean;
    onCancelado: (motivo: string) => void;
    version?: number;
    stream?: MediaStream | null;
}
