import { Proyecto, Tarea, User } from '../../../types/index';
import { formatDate } from '../../../lib/utils';
import { checkDateCompliance } from './kpiEngine';

/**
 * Genera los datos para el reporte de Cumplimiento en Fecha.
 * Utiliza checkDateCompliance para determinar el estado de forma consistente.
 */
export const getDeadlineData = (proyectos: Proyecto[], tareas: Tarea[], users: User[]) => {
  return tareas
    // Fix: Use FRealFin instead of fecha_real_fin
    .filter(t => t.estado === 'FINALIZADA' && t.FRealFin)
    .map(t => {
      // Fix: Use FPlaneadaFinAct and FPlaneadaFinOrig
      const planeada = new Date(t.FPlaneadaFinAct || t.FPlaneadaFinOrig).getTime();
      // Fix: Use FRealFin
      const real = new Date(t.FRealFin!).getTime();
      const diff = Math.ceil((real - planeada) / (1000 * 60 * 60 * 24));
      
      // Fix: Use ID_Ejecutor (string) and compare with stringified u.id
      const responsable = users.find(u => u.id.toString() === t.ID_Ejecutor)?.nombre || 'Sin Asignar';
      const isCompliant = checkDateCompliance(t);

      return {
        'Tarea': t.nombre,
        'Proyecto': proyectos.find(p => p.id === t.id_proyecto)?.nombre || 'N/A',
        'Responsable': responsable,
        // Fix: Use FPlaneadaFinAct or FPlaneadaFinOrig
        'Fecha Planeada': formatDate(t.FPlaneadaFinAct || t.FPlaneadaFinOrig),
        // Fix: Use FRealFin
        'Fecha Real': formatDate(t.FRealFin),
        'Desviación (Días)': diff > 0 ? `+${diff}` : `${diff}`,
        'Estado': isCompliant ? 'A TIEMPO' : 'RETRASO'
      };
    });
};