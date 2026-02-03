
import { Tarea } from '../../../types/index';
import { getDaysDiff, checkDurationCompliance } from './kpiEngine';

export const getDurationData = (tareas: Tarea[]) => {
  return tareas
    .filter(t => t.Estado === 'FINALIZADA' && t.FRealFin && t.FRealInicio)
    .map(t => {
      const pDays = getDaysDiff(t.FPlaneadaInicioAct, t.FPlaneadaFinAct);
      const rDays = getDaysDiff(t.FRealInicio, t.FRealFin);
      
      const isCompliant = checkDurationCompliance(t);
      const deviation = rDays - pDays;
      
      return {
        'Tarea': t.Title, 
        'Días Planeados': pDays, 
        'Días Reales': rDays, 
        'Desviación': deviation > 0 ? `+${deviation}` : `${deviation}`, 
        'Cumplimiento': isCompliant ? 'SÍ' : 'NO',
        '% Eficiencia': rDays > 0 ? Math.round((pDays / rDays) * 100) + '%' : '0%'
      };
    });
};
