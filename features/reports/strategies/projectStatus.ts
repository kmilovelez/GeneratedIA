
import { Proyecto, Tarea } from '../../../types/index';

/**
 * Genera los datos para el reporte de Estado de Proyectos con desglose por disciplina.
 * Prioridad de estados: WIP > FROZEN > FINALIZADA > DECK
 */
export const getProjectStatusData = (proyectos: Proyecto[], tareas: Tarea[], filters: { linea: string }) => {
  return proyectos
    .filter(p => filters.linea === 'all' || p.id_linea_negocio === parseInt(filters.linea))
    .map(p => {
      // Filtrar tareas pertenecientes a este proyecto
      const projectTasks = tareas.filter(t => t.id_proyecto === p.id);
      
      /**
       * Determina el estado de una disciplina específica según las reglas de negocio:
       * 1. WIP si alguna tarea está en WIP.
       * 2. FROZEN si no hay WIP y alguna está en FROZEN.
       * 3. FINALIZADA si todas están FINALIZADAS.
       * 4. DECK si no hay tareas o todas están en DECK.
       */
      const getDisciplineStatus = (disciplineId: number): string => {
        const dTasks = projectTasks.filter(t => t.id_disciplina === disciplineId);
        
        if (dTasks.length === 0) return 'DECK';
        
        if (dTasks.some(t => t.estado === 'WIP')) return 'WIP';
        if (dTasks.some(t => t.estado === 'FROZEN')) return 'FROZEN';
        if (dTasks.every(t => t.estado === 'FINALIZADA')) return 'FINALIZADA';
        
        return 'DECK';
      };

      return {
        'OT': p.ot,
        'Proyecto': p.nombre,
        'Mecánica': getDisciplineStatus(3), // ID 3 según INITIAL_DISCIPLINAS
        'Control': getDisciplineStatus(2),   // ID 2 según INITIAL_DISCIPLINAS
        'Software': getDisciplineStatus(1)   // ID 1 según INITIAL_DISCIPLINAS
      };
    });
};
