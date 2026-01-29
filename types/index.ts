
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
  ot: string;
  id_linea_negocio: number;
  id_gerente_proyecto: number;
  estado: ProjectStatus;
  fecha_creacion: string;
}

export interface Tarea {
  id: number;
  id_proyecto: number;
  ID_Disciplina: string; // SharePoint Column: ID_Disciplina (String)
  nombre: string; // SharePoint Column: Title
  ID_Ejecutor: string; // SharePoint Column: ID_Ejecutor (String/Email)
  id_gerente_tarea: number;
  estado: ProjectStatus;
  FPlaneadaInicioOrig: string; // SharePoint Column: FPlaneadaInicioOrig
  FPlaneadaFinOrig: string; // SharePoint Column: FPlaneadaFinOrig
  FPlaneadaInicioAct: string; // SharePoint Column: FPlaneadaInicioAct
  FPlaneadaFinAct: string; // SharePoint Column: FPlaneadaFinAct
  FRealInicio?: string; // SharePoint Column: FRealInicio
  FRealFin?: string; // SharePoint Column: FRealFin
  RazonRetraso?: string; // SharePoint Column: RazonRetraso
  OT: string; // SharePoint Column: OT
  fecha_creacion: string;
}

export interface Actividad {
  id: number;
  ID_Tarea: number; // Vínculo con el ID de la lista Tareas
  nombre: string;
  estado: ProjectStatus;
  IsStarted: boolean; // SharePoint Column: IsStarted (Boolean)
  IsCompleted: boolean; // SharePoint Column: IsCompleted (Boolean)
  fecha_creacion: string;
  FechaInicio?: string; // SharePoint Column: FechaInicio
  FechaFinalizacion?: string; // SharePoint Column: FechaFinalizacion
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
