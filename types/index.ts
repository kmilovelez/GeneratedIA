
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
  Title: string; // Nombre
  OT: string;
  ID_LineaNegocio: number;
  ID_GerenteProyecto: number;
  Estado: ProjectStatus;
  fecha_creacion: string;
}

export interface Tarea {
  id: number;
  Title: string; // Nombre
  OT: string; // Relación con Proyecto.OT
  ID_Disciplina: number;
  GerenteTarea: number; // ID_GerenteTarea
  ID_Ejecutor: number;
  Estado: ProjectStatus;
  FPlaneadaInicioOrig: string;
  FPlaneadaFinOrig: string;
  FPlaneadaInicioAct: string;
  FPlaneadaFinAct: string;
  FEsperadaIni?: string;
  FEsperadaFin?: string;
  FRealInicio?: string;
  FRealFin?: string;
  RazonRetraso?: string;
  ID_Unico_Tarea: string;
  fecha_creacion: string;
}

export interface Actividad {
  id: number;
  ID_Unico_Tarea: string; // Coincide con Tarea.ID_Unico_Tarea
  Title: string;
  IsStarted: boolean;
  IsCompleted: boolean;
  FechaInicio?: string;
  FechaFinalizacion?: string;
  ID_Tarea_Legacy?: string; // Para compatibilidad interna si fuera necesario
  fecha_creacion: string;
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
