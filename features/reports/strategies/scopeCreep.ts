
import { Proyecto, Tarea, Actividad } from '../../../types/index';
import { formatDate } from '../../../lib/utils';

export const getScopeCreepData = (proyectos: Proyecto[], tareas: Tarea[], actividades: Actividad[]) => {
  const growth: any[] = [];
  
  tareas.forEach(t => {
    // Fix: Actividad property name is ID_Tarea and Tarea uses ID_Unico_Tarea
    const taskActs = actividades.filter(a => a.ID_Tarea === t.ID_Unico_Tarea);
    
    // Lógica de negocio: Actividades creadas más de 1 minuto después de la tarea
    const extraActs = taskActs.filter(a => {
      const taskCreationTime = new Date(t.fecha_creacion).getTime();
      const activityCreationTime = new Date(a.fecha_creacion).getTime();
      return activityCreationTime > taskCreationTime + 60000;
    });

    extraActs.forEach(a => {
      growth.push({
        // Fix: Tarea links to Proyecto via OT string
        'Proyecto': proyectos.find(p => p.OT === t.OT)?.nombre || 'N/A',
        'Tarea': t.nombre,
        'Actividad Agregada': a.nombre,
        'Fecha Tarea': formatDate(t.fecha_creacion),
        'Fecha Adición': formatDate(a.fecha_creacion)
      });
    });
  });
  
  return growth;
};
