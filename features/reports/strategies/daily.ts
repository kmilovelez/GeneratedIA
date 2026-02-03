
import { Proyecto, Tarea, Actividad, User } from '../../../types/index';
import { formatDate } from '../../../lib/utils';

/**
 * Genera los datos para el reporte de Cumplimiento Diario.
 * Cruza Actividad -> Tarea -> Proyecto para dar contexto total.
 */
export const getDailyData = (
  proyectos: Proyecto[], 
  tareas: Tarea[], 
  actividades: Actividad[], 
  users: User[]
) => {
  return actividades.map(a => {
    // Lookup de Tarea por ID_Unico_Tarea
    const tareaMadre = tareas.find(t => t.ID_Unico_Tarea === a.ID_Unico_Tarea);
    
    // Lookup de Proyecto (usando la tarea encontrada por OT)
    const proyectoVinculado = proyectos.find(p => p.OT === tareaMadre?.OT);
    
    // Lookup de Responsable (ejecutor de la tarea)
    const responsable = users.find(u => u.id === tareaMadre?.ID_Ejecutor);
    
    // Determinación de estado textual de la actividad
    const estadoActividad = a.IsCompleted ? 'FINALIZADA' : (a.IsStarted ? 'WIP' : 'DECK');

    return {
      'OT': proyectoVinculado?.OT || 'N/A',
      'Proyecto': proyectoVinculado?.Title || 'N/A',
      'Actividad': a.Title,
      'Responsable': responsable?.nombre || 'Sin Asignar',
      'Estado': estadoActividad,
      'Fecha Registro': formatDate(a.fecha_creacion),
      'Tarea Madre': tareaMadre?.Title || 'N/A',
      'Cumplida': a.IsCompleted ? 'SÍ' : 'NO'
    };
  }).sort((a, b) => {
    const dateA = new Date(a['Fecha Registro']).getTime();
    const dateB = new Date(b['Fecha Registro']).getTime();
    return dateB - dateA;
  });
};
