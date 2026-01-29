
import { Tarea } from '../../../types/index';
import { getDaysDiff, checkDurationCompliance } from './kpiEngine';

/**
 * Genera los datos para el reporte de Cumplimiento de Duración.
 * Utiliza el motor de KPIs para asegurar consistencia en los cálculos.
 */
export const getDurationData = (tareas: Tarea[]) => {
  return tareas
    // Fix: Use FRealFin and FRealInicio instead of fecha_real_fin and fecha_real_inicio
    .filter(t => t.FRealFin && t.FRealInicio)
    .map(t => {
      // Fix: Use FPlaneadaInicioAct and FPlaneadaFinAct
      const pDays = getDaysDiff(t.FPlaneadaInicioAct, t.FPlaneadaFinAct);
      // Fix: Use FRealInicio and FRealFin
      const rDays = getDaysDiff(t.FRealInicio!, t.FRealFin!);
      
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