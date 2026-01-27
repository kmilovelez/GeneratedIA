
import { Proyecto, Tarea, User } from '../../../types/index';
import { formatDate } from '../../../lib/utils';

export const getDeadlineData = (proyectos: Proyecto[], tareas: Tarea[], users: User[]) => {
  return tareas
    .filter(t => t.estado === 'finalizado' && t.fecha_real_fin)
    .map(t => {
      const planeada = new Date(t.fecha_planeada_fin_actualizada || t.fecha_planeada_fin_original).getTime();
      const real = new Date(t.fecha_real_fin!).getTime();
      const diff = Math.ceil((real - planeada) / (1000 * 60 * 60 * 24));
      const responsable = users.find(u => u.id === t.id_ejecutor)?.nombre || 'Sin Asignar';
      
      return {
        'Tarea': t.nombre,
        'Proyecto': proyectos.find(p => p.id === t.id_proyecto)?.nombre || 'N/A',
        'Responsable': responsable,
        'Fecha Planeada': formatDate(t.fecha_planeada_fin_actualizada || t.fecha_planeada_fin_original),
        'Fecha Real': formatDate(t.fecha_real_fin),
        'Desviación (Días)': diff > 0 ? `+${diff}` : diff,
        'Estado': diff > 0 ? 'RETRASO' : 'A TIEMPO'
      };
    });
};
