
import { Tarea, Actividad } from '../../../types/index';

/**
 * Calcula la diferencia en días entre dos fechas ISO strings.
 */
export const getDaysDiff = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Filtra tareas finalizadas dentro de un periodo específico.
 */
const filterByPeriod = <T>(entities: T[], dateField: keyof T, periodo: 'WEEK' | 'MONTH' | 'YTD'): T[] => {
  const now = new Date();
  return entities.filter(e => {
    const dateValue = e[dateField];
    if (!dateValue) return false;
    
    const date = new Date(dateValue as unknown as string);
    switch (periodo) {
      case 'WEEK':
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        return date >= lastWeek;
      case 'MONTH':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case 'YTD':
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
};

/**
 * Verifica el cumplimiento de duración: Duración Real <= Duración Planeada Actualizada.
 */
export const checkDurationCompliance = (tarea: Tarea): boolean => {
  const { 
    FPlaneadaInicioAct: pStart, 
    FPlaneadaFinAct: pEnd,
    FRealInicio: rStart,
    FRealFin: rEnd 
  } = tarea;

  if (!pStart || !pEnd || !rStart || !rEnd) return false;

  const plannedDuration = getDaysDiff(pStart, pEnd);
  const realDuration = getDaysDiff(rStart, rEnd);

  return realDuration <= plannedDuration;
};

/**
 * Verifica el cumplimiento en fecha: Fecha Real Fin <= Fecha Planeada Fin Actualizada.
 */
export const checkDateCompliance = (tarea: Tarea): boolean => {
  const { FPlaneadaFinAct: pEnd, FRealFin: rEnd } = tarea;
  if (!pEnd || !rEnd) return false;

  const plannedDate = new Date(pEnd).getTime();
  const realDate = new Date(rEnd).getTime();

  return realDate <= plannedDate;
};

/**
 * Verifica el cumplimiento diario: Se espera que una actividad operativa se complete el mismo día o en 24h.
 */
export const checkDailyCompliance = (actividad: Actividad): boolean => {
  const { FechaInicio: start, FechaFinalizacion: end } = actividad;
  if (!start || !end) return false;
  
  // En KPIs operativos, consideramos cumplimiento si rDuracion <= 1 día
  return getDaysDiff(start, end) <= 1;
};

/**
 * KPI de Progreso Global.
 */
export const calculateProjectProgress = (tareas: Tarea[]): number => {
  if (!tareas || tareas.length === 0) return 0;
  const completedCount = tareas.filter(t => t.estado === 'FINALIZADA').length;
  return Math.round((completedCount / tareas.length) * 100);
};

/**
 * Índice de Eficiencia Operativa (Actividades finalizadas vs iniciadas).
 */
export const calculateResourceEfficiency = (actividades: Actividad[]): number => {
  if (!actividades || actividades.length === 0) return 0;
  const startedCount = actividades.filter(a => a.IsStarted).length;
  if (startedCount === 0) return 0;
  const completedCount = actividades.filter(a => a.IsCompleted).length;
  return Math.round((completedCount / startedCount) * 100);
};
