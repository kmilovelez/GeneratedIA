
import { Tarea } from '../../../types/index';

export const getDurationData = (tareas: Tarea[]) => {
  return tareas
    .filter(t => t.fecha_real_fin && t.fecha_real_inicio)
    .map(t => {
      const startP = new Date(t.fecha_planeada_inicio_actualizada).getTime();
      const endP = new Date(t.fecha_planeada_fin_actualizada).getTime();
      const startR = new Date(t.fecha_real_inicio!).getTime();
      const endR = new Date(t.fecha_real_fin!).getTime();
      
      const pDays = Math.ceil((endP - startP) / (1000 * 60 * 60 * 24));
      const rDays = Math.ceil((endR - startR) / (1000 * 60 * 60 * 24));
      
      return {
        'Tarea': t.nombre, 
        'Días Planeados': pDays, 
        'Días Reales': rDays, 
        'Desviación': rDays - pDays, 
        '% Cumpl.': Math.round((pDays / rDays) * 100) + '%'
      };
    });
};
