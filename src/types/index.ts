export type Rol = 'ADMIN' | 'ESTUDIANTE';

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