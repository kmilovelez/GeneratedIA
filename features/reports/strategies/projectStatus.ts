
import { Proyecto, Tarea, ProjectStatus } from '../../../types/index';

/**
 * Determina el estado resultante de un conjunto de tareas basado en una jerarquía.
 * Prioridad (Mayor a Menor): WIP > FROZEN > FINALIZADA > DECK
 */
export const calculateStatusPriority = (statuses: ProjectStatus[]): ProjectStatus => {
  if (statuses.length === 0) return 'DECK';

  const priorityOrder: ProjectStatus[] = ['WIP', 'FROZEN', 'FINALIZADA', 'DECK'];
  
  // Buscamos el primer estado de la jerarquía que esté presente en el conjunto
  for (const status of priorityOrder) {
    if (status === 'FINALIZADA') {
      // Para FINALIZADA, todas deben estar finalizadas
      if (statuses.every(s => s === 'FINALIZADA')) return 'FINALIZADA';
      continue;
    }
    if (statuses.includes(status)) return status;
  }
  
  return 'DECK';
};

/**
 * Genera la matriz de estado de proyectos por disciplina.
 */
export const getProjectStatusData = (proyectos: Proyecto[], tareas: Tarea[], filters: { linea: string }) => {
  return proyectos
    .filter(p => filters.linea === 'all' || p.id_linea_negocio === parseInt(filters.linea))
    .map(p => {
      // Fix: Tarea links to Proyecto via OT string, not id_proyecto
      const projectTasks = tareas.filter(t => t.OT === p.OT);
      
      const getDisciplineStatus = (disciplineId: number): ProjectStatus => {
        const dTasks = projectTasks.filter(t => t.id_disciplina === disciplineId);
        const taskStatuses = dTasks.map(t => t.estado);
        return calculateStatusPriority(taskStatuses);
      };

      return {
        // Fix: Property name changed from ot to OT
        'OT': p.OT,
        'Proyecto': p.nombre,
        'Mecánica': getDisciplineStatus(3),
        'Control': getDisciplineStatus(2),
        'Software': getDisciplineStatus(1)
      };
    });
};
