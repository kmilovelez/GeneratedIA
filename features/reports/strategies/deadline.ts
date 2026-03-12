import { Proyecto, Tarea, User } from '../../../types/index';
import { formatDate, INITIAL_DISCIPLINAS } from '../../../lib/utils';
import { checkDateCompliance } from './kpiEngine';

export const getDeadlineData = (_proyectos: Proyecto[], tareas: Tarea[], _users: User[]) => {
  return tareas
    .filter((t) => t.Estado === 'FINALIZADA' && t.FRealFin)
    .map((t) => {
      const planeada = new Date(t.FPlaneadaFinAct || t.FPlaneadaFinOrig).getTime();
      const real = new Date(t.FRealFin!).getTime();
      const diff = Math.ceil((real - planeada) / (1000 * 60 * 60 * 24));
      const disciplina = INITIAL_DISCIPLINAS.find((d) => d.id === t.ID_Disciplina)?.nombre || 'N/A';
      const isCompliant = checkDateCompliance(t);

      return {
        Tarea: t.Title,
        OT: t.OT || 'N/A',
        Disciplina: disciplina,
        'Fecha Planeada': formatDate(t.FPlaneadaFinAct || t.FPlaneadaFinOrig),
        'Fecha Real': formatDate(t.FRealFin),
        'Desviacion (Dias)': diff > 0 ? `+${diff}` : `${diff}`,
        Estado: isCompliant ? 'A TIEMPO' : 'RETRASO'
      };
    });
};
