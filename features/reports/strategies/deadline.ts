
import { Proyecto, Tarea, User } from '../../../types/index';
import { formatDate } from '../../../lib/utils';
import { checkDateCompliance } from './kpiEngine';

export const getDeadlineData = (proyectos: Proyecto[], tareas: Tarea[], users: User[]) => {
  return tareas
    .filter(t => t.Estado === 'FINALIZADA' && t.FRealFin)
    .map(t => {
      const planeada = new Date(t.FPlaneadaFinAct || t.FPlaneadaFinOrig).getTime();
      const real = new Date(t.FRealFin!).getTime();
      
      const diff = Math.ceil((real - planeada) / (1000 * 60 * 60 * 24));
      const responsable = users.find(u => u.id === t.ID_Ejecutor)?.nombre || 'Sin Asignar';
      const isCompliant = checkDateCompliance(t);

      return {
        'Tarea': t.Title,
        'Proyecto': proyectos.find(p => p.OT === t.OT)?.Title || 'N/A',
        'Responsable': responsable,
        'Fecha Planeada': formatDate(t.FPlaneadaFinAct || t.FPlaneadaFinOrig),
        'Fecha Real': formatDate(t.FRealFin),
        'Desviación (Días)': diff > 0 ? `+${diff}` : `${diff}`,
        'Estado': isCompliant ? 'A TIEMPO' : 'RETRASO'
      };
    });
};
