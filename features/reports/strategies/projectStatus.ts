
import { Proyecto, Tarea, ProjectStatus } from '../../../types/index';

export const calculateStatusPriority = (statuses: ProjectStatus[]): ProjectStatus => {
  if (statuses.length === 0) return 'DECK';
  const priorityOrder: ProjectStatus[] = ['WIP', 'FROZEN', 'FINALIZADA', 'DECK'];
  for (const status of priorityOrder) {
    if (status === 'FINALIZADA') {
      if (statuses.every(s => s === 'FINALIZADA')) return 'FINALIZADA';
      continue;
    }
    if (statuses.includes(status)) return status;
  }
  return 'DECK';
};

export const getProjectStatusData = (proyectos: Proyecto[], tareas: Tarea[], filters: { linea: string }) => {
  return proyectos
    .filter(p => filters.linea === 'all' || p.ID_LineaNegocio === parseInt(filters.linea))
    .map(p => {
      const projectTasks = tareas.filter(t => t.OT === p.OT);
      
      const getDisciplineStatus = (disciplineId: number): ProjectStatus => {
        const dTasks = projectTasks.filter(t => t.ID_Disciplina === disciplineId);
        const taskStatuses = dTasks.map(t => t.Estado);
        return calculateStatusPriority(taskStatuses);
      };

      return {
        'OT': p.OT,
        'Proyecto': p.Title,
        'Mecánica': getDisciplineStatus(3),
        'Control': getDisciplineStatus(2),
        'Software': getDisciplineStatus(1)
      };
    });
};
