
import { Tarea } from '../../../types/index';
import { getDaysDiff, checkDurationCompliance } from './kpiEngine';

/**
 * Genera los datos para el reporte de Cumplimiento de Duración.
 * Utiliza el motor de KPIs para asegurar consistencia en los cálculos.
 */
export const getDurationData = (tareas: Tarea[]) => {
  return tareas
    .filter(t => t.fecha_real_fin && t.fecha_real_inicio)
    .map(t => {
      const pDays = getDaysDiff(t.fecha_planeada_inicio_actualizada, t.fecha_planeada_fin_actualizada);
      const rDays = getDaysDiff(t.fecha_real_inicio!, t.fecha_real_fin!);
      
      const isCompliant = checkDurationCompliance(t);
      const deviation = rDays - pDays;
      
      return {
        'Tarea': t.nombre, 
        'Días Planeados': pDays, 
        'Días Reales': rDays, 
        'Desviación': deviation > 0 ? `+${deviation}` : `${deviation}`, 
        'Cumplimiento': isCompliant ? 'SÍ' : 'NO',
        '% Eficiencia': rDays > 0 ? Math.round((pDays / rDays) * 100) + '%' : '0%'
      };
    });
};
