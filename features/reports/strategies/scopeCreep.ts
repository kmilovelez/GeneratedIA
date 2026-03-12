
import { Proyecto, Tarea, Actividad } from '../../../types/index';
import { formatDate, INITIAL_DISCIPLINAS } from '../../../lib/utils';

export const getScopeCreepData = (proyectos: Proyecto[], tareas: Tarea[], actividades: Actividad[]) => {
  const growth: any[] = [];
  
  tareas.forEach(t => {
    const taskActs = actividades.filter(a => a.ID_Unico_Tarea === t.ID_Unico_Tarea);
    const extraActs = taskActs.filter(a => {
      const taskCreationTime = new Date(t.fecha_creacion).getTime();
      const activityCreationTime = new Date(a.fecha_creacion).getTime();
      return activityCreationTime > taskCreationTime + 60000;
    });

    extraActs.forEach(a => {
      const disciplina = INITIAL_DISCIPLINAS.find((d) => d.id === t.ID_Disciplina)?.nombre || 'N/A';

      growth.push({
        'Proyecto': proyectos.find(p => p.OT === t.OT)?.Title || 'N/A',
        'OT': t.OT || 'N/A',
        'Disciplina': disciplina,
        'Tarea': t.Title,
        'Actividad Agregada': a.Title,
        'Fecha Tarea': formatDate(t.fecha_creacion),
        'Fecha Adición': formatDate(a.fecha_creacion)
      });
    });
  });
  
  return growth;
};
