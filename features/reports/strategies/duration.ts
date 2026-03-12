import { Tarea } from '../../../types/index';
import { INITIAL_DISCIPLINAS } from '../../../lib/utils';
import { getDaysDiff, checkDurationCompliance } from './kpiEngine';

export const getDurationData = (_proyectos: unknown[], tareas: Tarea[]) => {
  return tareas
    .filter((t) => t.Estado === 'FINALIZADA' && t.FRealFin && t.FRealInicio)
    .map((t) => {
      const pDays = getDaysDiff(t.FPlaneadaInicioAct, t.FPlaneadaFinAct);
      const rDays = getDaysDiff(t.FRealInicio, t.FRealFin);
      const disciplina = INITIAL_DISCIPLINAS.find((d) => d.id === t.ID_Disciplina)?.nombre || 'N/A';
      const isCompliant = checkDurationCompliance(t);
      const deviation = rDays - pDays;

      return {
        OT: t.OT || 'N/A',
        Disciplina: disciplina,
        Tarea: t.Title,
        'Dias Planeados': pDays,
        'Dias Reales': rDays,
        Desviacion: deviation > 0 ? `+${deviation}` : `${deviation}`,
        Cumplimiento: isCompliant ? 'SI' : 'NO',
        '% Eficiencia': rDays > 0 ? Math.round((pDays / rDays) * 100) + '%' : '0%'
      };
    });
};
