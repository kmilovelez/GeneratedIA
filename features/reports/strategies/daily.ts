import { Proyecto, Tarea, Actividad, User } from '../../../types/index';
import { formatDate } from '../../../lib/utils';
import { checkDailyCompliance } from './kpiEngine';

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
  return actividades
    .map((a) => {
      const tareaMadre = tareas.find((t) => t.ID_Unico_Tarea === a.ID_Unico_Tarea);
      const proyectoVinculado = proyectos.find((p) => p.OT === tareaMadre?.OT);
      const responsable = users.find((u) => u.id === tareaMadre?.ID_Ejecutor);
      const estadoActividad = a.IsCompleted ? 'FINALIZADA' : a.IsStarted ? 'WIP' : 'DECK';
      const responsableAbreviado = responsable?.email?.split('@')[0] || 'sin_asignar';

      return {
        OT: proyectoVinculado?.OT || 'N/A',
        Responsable: responsableAbreviado,
        Estado: estadoActividad,
        'Fecha Registro': formatDate(a.fecha_creacion),
        Cumplida: checkDailyCompliance(a) ? 'SI' : 'NO',
        Actividad: a.Title,
        'Tarea Madre': tareaMadre?.Title || 'N/A'
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a['Fecha Registro']).getTime();
      const dateB = new Date(b['Fecha Registro']).getTime();
      return dateB - dateA;
    });
};
