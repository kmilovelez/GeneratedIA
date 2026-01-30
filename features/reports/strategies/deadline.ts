
import { Proyecto, Tarea, User } from '../../../types/index';
import { formatDate } from '../../../lib/utils';
import { checkDateCompliance } from './kpiEngine';

/**
 * Genera los datos para el reporte de Cumplimiento en Fecha.
 * Utiliza checkDateCompliance del motor central para garantizar consistencia.
 */
export const getDeadlineData = (proyectos: Proyecto[], tareas: Tarea[], users: User[]) => {
  return tareas
    // Fix: Property name changed to FRealFin
    .filter(t => t.estado === 'FINALIZADA' && t.FRealFin)
    .map(t => {
      // Fix: Property names changed to match Tarea type (FPlaneadaFinAct, FPlaneadaFinOri, FRealFin)
      const planeada = new Date(t.FPlaneadaFinAct || t.FPlaneadaFinOri).getTime();
      const real = new Date(t.FRealFin!).getTime();
      
      // Cálculo de desviación para visualización informativa en el reporte
      const diff = Math.ceil((real - planeada) / (1000 * 60 * 60 * 24));
      
      const responsable = users.find(u => u.id === t.id_ejecutor)?.nombre || 'Sin Asignar';
      
      // Aplicación de la regla de negocio centralizada
      const isCompliant = checkDateCompliance(t);

      return {
        'Tarea': t.nombre,
        // Fix: Tarea links to Proyecto via OT string
        'Proyecto': proyectos.find(p => p.OT === t.OT)?.nombre || 'N/A',
        'Responsable': responsable,
        // Fix: Property names changed to match Tarea type
        'Fecha Planeada': formatDate(t.FPlaneadaFinAct || t.FPlaneadaFinOri),
        'Fecha Real': formatDate(t.FRealFin),
        'Desviación (Días)': diff > 0 ? `+${diff}` : `${diff}`,
        'Estado': isCompliant ? 'A TIEMPO' : 'RETRASO'
      };
    });
};
