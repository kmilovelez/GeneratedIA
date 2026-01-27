
import { ProjectStatus, Role } from '../types/index';
import { Building2, Truck, Factory } from 'lucide-react';

export const formatDate = (date: string | undefined) => date ? new Date(date).toLocaleDateString() : '-';

export const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case 'deck': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'wip': return 'bg-blue-100 text-blue-600 border-blue-200';
    case 'frozen': return 'bg-cyan-100 text-cyan-600 border-cyan-200';
    case 'finalizado': return 'bg-green-100 text-green-600 border-green-200';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export const getRoleBadgeColor = (role: Role) => {
  switch (role) {
    case 'administrador': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'gerente_proyecto': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'gerente_tarea': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'lider_integracion': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'ejecutor': return 'bg-slate-100 text-slate-700 border-slate-200';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export const INITIAL_LINEAS = [
  { id: 1, nombre: 'Aeropuertos', icon: Building2 },
  { id: 2, nombre: 'Logística', icon: Truck },
  { id: 3, nombre: 'Cartón', icon: Factory },
];

export const INITIAL_DISCIPLINAS = [
  { id: 1, nombre: 'Software' }, 
  { id: 2, nombre: 'Control' },
  { id: 3, nombre: 'Mecánica' },
];

export const DEFAULT_USERS = [
  { id: 1, nombre: 'Admin Master', email: 'admin@recursos.com', rol: 'administrador' as Role },
  { id: 2, nombre: 'Juan Proyecto', email: 'juan@recursos.com', rol: 'gerente_proyecto' as Role },
  { id: 3, nombre: 'Ana Tarea', email: 'ana@recursos.com', rol: 'gerente_tarea' as Role },
  { id: 4, nombre: 'Pedro Ejecutor', email: 'pedro@recursos.com', rol: 'ejecutor' as Role },
];
