
export type Role = 'administrador' | 'gerente_proyecto' | 'gerente_tarea' | 'lider_integracion' | 'ejecutor';
export type ProjectStatus = 'DECK' | 'FROZEN' | 'WIP' | 'FINALIZADA';
export type LineaNegocio = 'Aeropuertos' | 'Logística' | 'Cartón';
export type Disciplina = 'Ingeniería de Software' | 'Ingeniería de Automation y Control' | 'Ingeniería Mecánica';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: Role;
}

export interface Proyecto {
  id: number;
  nombre: string;
  id_linea_negocio: number;
  id_gerente_proyecto: number;
  estado: ProjectStatus;
  fecha_creacion: string;
}

export interface Tarea {
  id: number;
  id_proyecto: number;
  id_disciplina: number;
  nombre: string;
  id_ejecutor: number;
  id_gerente_tarea: number;
  estado: ProjectStatus;
  fecha_planeada_inicio_original: string;
  fecha_planeada_fin_original: string;
  fecha_planeada_inicio_actualizada: string;
  fecha_planeada_fin_actualizada: string;
  fecha_esperada_inicio?: string;
  fecha_esperada_fin?: string;
  fecha_real_inicio?: string;
  fecha_real_fin?: string;
  razon_retraso?: string;
  fecha_creacion: string;
}

export interface Actividad {
  id: number;
  id_tarea: number;
  nombre: string;
  estado: ProjectStatus;
  isStarted: boolean;
  isCompleted: boolean;
  fecha_creacion: string;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  razon_no_cumplimiento?: string;
}

export interface Alerta {
  id: number;
  tipo: 'retraso_inicio' | 'retraso_finalizacion';
  id_tarea: number;
  mensaje: string;
  activa: boolean;
}

export interface LineaNegocioOption {
    id: number;
    nombre: string;
    icon: any; 
}

export interface DisciplinaOption {
    id: number;
    nombre: string;
}
