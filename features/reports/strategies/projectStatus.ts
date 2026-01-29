
import { Proyecto, Tarea, ProjectStatus } from '../../../types/index';

/**
 * Función pura que determina el estado resultante basado en una jerarquía de prioridades.
 * Jerarquía: WIP > FROZEN > FINALIZADA > DECK
 */
export const calculateStatusPriority = (statuses: ProjectStatus[]): ProjectStatus => {
  if (statuses.length === 0) return 'DECK';
  
  if (statuses.includes('WIP')) return 'WIP';
  if (statuses.includes('FROZEN')) return 'FROZEN';
  if (statuses.every(s => s === 'FINALIZADA')) return 'FINALIZADA';
  
  return 'DECK';
};

/**
 * Genera los datos para el reporte de Estado de Proyectos con desglose por disciplina.
 */
export const getProjectStatusData = (proyectos: Proyecto[], tareas: Tarea[], filters: { linea: string }) => {
  return proyectos
    .filter(p => filters.linea === 'all' || p.id_linea_negocio === parseInt(filters.linea))
    .map(p => {
      const projectTasks = tareas.filter(t => t.id_proyecto === p.id);
      
      const getDisciplineStatus = (disciplineId: number): ProjectStatus => {
        const dTasks = projectTasks.filter(t => t.id_disciplina === disciplineId);
        const taskStatuses = dTasks.map(t => t.estado);
        return calculateStatusPriority(taskStatuses);
      };

      return {
        'OT': p.ot,
        'Proyecto': p.nombre,
        'Mecánica': getDisciplineStatus(3),
        'Control': getDisciplineStatus(2),
        'Software': getDisciplineStatus(1)
      };
    });
};
