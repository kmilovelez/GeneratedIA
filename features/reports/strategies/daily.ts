
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
    // Lookup de Tarea
    // Fix: Actividad uses ID_Tarea to match Tarea.ID_Unico_Tarea
    const tareaMadre = tareas.find(t => t.ID_Unico_Tarea === a.ID_Tarea);
    
    // Lookup de Proyecto (usando la tarea encontrada)
    // Fix: Tarea links to Proyecto via OT string
    const proyectoVinculado = proyectos.find(p => p.OT === tareaMadre?.OT);
    
    // Lookup de Responsable (ejecutor de la tarea)
    const responsable = users.find(u => u.id === tareaMadre?.id_ejecutor);
    
    // Determinación de estado textual de la actividad
    const estadoActividad = a.isCompleted ? 'FINALIZADA' : (a.isStarted ? 'WIP' : 'DECK');

    // El orden de las llaves define el orden de las columnas en la UI
    return {
      // Fix: Property name changed to OT
      'OT': proyectoVinculado?.OT || 'N/A',
      'Proyecto': proyectoVinculado?.nombre || 'N/A',
      'Actividad': a.nombre,
      'Responsable': responsable?.nombre || 'Sin Asignar',
      'Estado': estadoActividad,
      'Fecha Registro': formatDate(a.fecha_creacion),
      'Tarea Madre': tareaMadre?.nombre || 'N/A',
      'Cumplida': a.isCompleted ? 'SÍ' : 'NO'
    };
  }).sort((a, b) => {
    // Ordenar por fecha de registro descendente
    const dateA = new Date(a['Fecha Registro']).getTime();
    const dateB = new Date(b['Fecha Registro']).getTime();
    return dateB - dateA;
  });
};
