
import { Proyecto, Tarea, Actividad } from '../../../types/index';
import { formatDate } from '../../../lib/utils';

export const getDailyData = (proyectos: Proyecto[], tareas: Tarea[], actividades: Actividad[]) => {
  return actividades.map(a => {
    const t = tareas.find(ta => ta.id === a.id_tarea);
    return {
      'Fecha Registro': formatDate(a.fecha_creacion),
      'Actividad': a.nombre,
      'Tarea': t?.nombre || 'N/A',
      'Proyecto': proyectos.find(p => p.id === t?.id_proyecto)?.nombre || 'N/A',
      'Cumplida': a.isCompleted ? 'SÍ' : 'NO'
    };
  }).sort((a,b) => new Date(b['Fecha Registro']).getTime() - new Date(a['Fecha Registro']).getTime());
};
