
import { Tarea } from '../../../types/index';
import { getDaysDiff, checkDurationCompliance } from './kpiEngine';

/**
 * Genera los datos para el reporte de Cumplimiento de Duración.
 * Delegando la lógica de cálculo al motor de KPIs centralizado (kpiEngine).
 */
export const getDurationData = (tareas: Tarea[]) => {
  return tareas
    // Fix: Property names changed to match Tarea type (FRealFin, FRealIni)
    .filter(t => t.estado === 'FINALIZADA' && t.FRealFin && t.FRealIni)
    .map(t => {
      // Usamos el motor para obtener los días de forma consistente
      // Fix: Property names changed to match Tarea type (FPlaneadaIniAct, FPlaneadaFinAct, FRealIni, FRealFin)
      const pDays = getDaysDiff(t.FPlaneadaIniAct, t.FPlaneadaFinAct);
      const rDays = getDaysDiff(t.FRealIni, t.FRealFin);
      
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
