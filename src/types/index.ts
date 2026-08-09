export type Rol = 'ADMIN' | 'ESTUDIANTE';

export type TipoPregunta =
    | 'OPCION_MULTIPLE'
    | 'VERDADERO_FALSO'
    | 'ABIERTA'
    | 'RELACIONAR'
    | 'COMPLETAR';

export type EstadoIntento = 'EN_PROGRESO' | 'ENTREGADO' | 'CALIFICADO' | 'CANCELADO' | 'REPROBADO';

export interface AnalisisProctoring {
    movimiento: number;
    rostro_detectado: boolean;
    ojos_cerrados: boolean;
    boca_abierta: boolean;
    mirando_camara: boolean;
    cabeza_volteada: boolean;
    yaw: number;
    parpadeo: number;
    mandibula: number;
}

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
    llamadas_atencion?: number;
    reintento_permitido?: boolean;
    motivo_admin?: string | null;
}

export interface AsignacionExamenInfo {
    fecha_inicio: string | null;
    fecha_fin: string | null;
}

export interface ExamenDisponible {
    id: string;
    titulo: string;
    descripcion: string | null;
    categoria: { nombre: string };
    _count: { preguntas: number };
    asignacion?: AsignacionExamenInfo;
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
    evidencias?: Evidencia[];
}

export type TipoEvidencia = 'CAPTURA' | 'GRABACION';

export interface Evidencia {
    id: string;
    intento_id: string;
    incidente_id: string | null;
    tipo: TipoEvidencia;
    archivo: string;
    mime: string | null;
    tamano: number | null;
    creado_en: string;
    url?: string;
    incidente?: Pick<IncidenteSupervision, 'id' | 'tipo' | 'descripcion' | 'creado_en'> | null;
}

export interface ResultadoIncidente {
    incidente: IncidenteSupervision;
    cancelado: boolean;
    advertencia: boolean;
    llamadas_atencion: number;
    strikes?: number;
    motivo?: string;
}

export interface IntentoSupervision {
    id: string;
    estado: EstadoIntento;
    calificacion_final: number | null;
    llamadas_atencion: number;
    reintento_permitido: boolean;
    motivo_admin: string | null;
    iniciado_en: string;
    entregado_en: string | null;
    estudiante: { id: string; nombre: string; email: string };
    examen: { id: string; titulo: string };
    _count: { incidentes: number; evidencias: number };
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
    /** Nivel de audio en dBFS (negativo, live). -60 ≈ silencio, 0 ≈ escala completa */
    nivelAudio: number;
}

export interface UseProctoringOptions {
    intentoId: string;
    supervisionActiva: boolean;
    onCancelado: (motivo: string) => void;
    version?: number;
    stream?: MediaStream | null;
}

// ── Grupos y asignaciones ─────────────────────────────────

export interface GrupoResumen {
    id: string;
    nombre: string;
    descripcion: string | null;
    creado_en: string;
    _count: { estudiantes: number; asignaciones: number };
}

export interface GrupoDetalle extends GrupoResumen {
    estudiantes: { id: string; agregado_en: string; estudiante: { id: string; nombre: string; email: string; activo: boolean } }[];
    asignaciones: {
        id: string;
        fecha_inicio: string | null;
        fecha_fin: string | null;
        asignado_en: string;
        examen: { id: string; titulo: string; descripcion: string | null; publicado: boolean; categoria: { id: string; nombre: string } };
    }[];
}

export interface EstudianteDisponible {
    id: string;
    nombre: string;
    email: string;
}
