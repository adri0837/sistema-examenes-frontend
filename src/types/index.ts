export type Rol = 'ADMIN' | 'ESTUDIANTE';

export type TipoPregunta =
    | 'OPCION_MULTIPLE'
    | 'VERDADERO_FALSO'
    | 'ABIERTA'
    | 'RELACIONAR'
    | 'COMPLETAR';

export type EstadoIntento = 'EN_PROGRESO' | 'ENTREGADO' | 'CALIFICADO';

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
    tiempo_limite_min: number | null;
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
    tiempo_limite_min: number | null;
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
