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
    // Fix: Use ID_Tarea instead of id_tarea
    const tareaMadre = tareas.find(t => t.id === a.ID_Tarea);
    
    // Lookup de Proyecto (usando la tarea encontrada)
    const proyectoVinculado = proyectos.find(p => p.id === tareaMadre?.id_proyecto);
    
    // Lookup de Responsable (ejecutor de la tarea)
    // Fix: Use ID_Ejecutor (string) and compare with stringified u.id
    const responsable = users.find(u => u.id.toString() === tareaMadre?.ID_Ejecutor);
    
    // Determinación de estado textual de la actividad
    // Fix: Use IsCompleted and IsStarted (PascalCase)
    const estadoActividad = a.IsCompleted ? 'FINALIZADA' : (a.IsStarted ? 'WIP' : 'DECK');

    // El orden de las llaves define el orden de las columnas en la UI
    return {
      'OT': proyectoVinculado?.ot || 'N/A',
      'Proyecto': proyectoVinculado?.nombre || 'N/A',
      'Actividad': a.nombre,
      'Responsable': responsable?.nombre || 'Sin Asignar',
      'Estado': estadoActividad,
      'Fecha Registro': formatDate(a.fecha_creacion),
      'Tarea Madre': tareaMadre?.nombre || 'N/A',
      // Fix: Use IsCompleted
      'Cumplida': a.IsCompleted ? 'SÍ' : 'NO'
    };
  }).sort((a, b) => {
    // Ordenar por fecha de registro descendente
    const dateA = new Date(a['Fecha Registro']).getTime();
    const dateB = new Date(b['Fecha Registro']).getTime();
    return dateB - dateA;
  });
};