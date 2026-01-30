import { Tarea, Actividad } from '../../../types/index';

/**
 * Calcula la diferencia en días entre dos fechas ISO.
 * Retorna 0 si las fechas son inválidas o faltan.
 */
export const getDaysDiff = (start: string | undefined, end: string | undefined): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Función auxiliar compartida para obtener la fecha de inicio según el periodo.
 */
const getStartDateByPeriod = (periodo: 'WEEK' | 'MONTH' | 'YTD'): Date => {
  const now = new Date();
  switch (periodo) {
    case 'WEEK':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'MONTH':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(0);
  }
};

/**
 * Filtra tareas FINALIZADAS dentro de un periodo específico.
 */
const getFinishedTasksByPeriod = (tareas: Tarea[], periodo: 'WEEK' | 'MONTH' | 'YTD'): Tarea[] => {
  const startDate = getStartDateByPeriod(periodo);
  return tareas.filter(t => {
    if (t.estado !== 'FINALIZADA' || !t.fecha_real_fin) return false;
    const finishDate = new Date(t.fecha_real_fin);
    return finishDate >= startDate;
  });
};

/**
 * Filtra actividades CULMINADAS dentro de un periodo específico.
 */
const getCompletedActivitiesByPeriod = (actividades: Actividad[], periodo: 'WEEK' | 'MONTH' | 'YTD'): Actividad[] => {
  const startDate = getStartDateByPeriod(periodo);
  return actividades.filter(a => {
    if (!a.isCompleted || !a.fecha_finalizacion) return false;
    const finishDate = new Date(a.fecha_finalizacion);
    return finishDate >= startDate;
  });
};

/**
 * Verifica el cumplimiento de duración de una tarea.
 * (Duración Planeada - Duración Real) >= 0 
 */
export const checkDurationCompliance = (tarea: Tarea): boolean => {
  const { 
    fecha_planeada_inicio_actualizada: pStart, 
    fecha_planeada_fin_actualizada: pEnd,
    fecha_real_inicio: rStart,
    fecha_real_fin: rEnd 
  } = tarea;

  if (!pStart || !pEnd || !rStart || !rEnd) return false;

  const plannedDuration = getDaysDiff(pStart, pEnd);
  const realDuration = getDaysDiff(rStart, rEnd);

  return (plannedDuration - realDuration) >= 0;
};

/**
 * Verifica si una tarea se entregó en la fecha planeada o antes.
 */
export const checkDateCompliance = (tarea: Tarea): boolean => {
  const { fecha_planeada_fin_actualizada: pEnd, fecha_real_fin: rEnd } = tarea;
  if (!pEnd || !rEnd) return false;
  
  return new Date(rEnd).getTime() <= new Date(pEnd).getTime();
};

/**
 * Verifica el cumplimiento diario de una actividad.
 * Retorna true si la duración real es exactamente de 1 día.
 */
export const checkDailyCompliance = (actividad: Actividad): boolean => {
  if (!actividad.fecha_inicio || !actividad.fecha_finalizacion) return false;
  return getDaysDiff(actividad.fecha_inicio, actividad.fecha_finalizacion) === 1;
};

/**
 * Calcula el porcentaje de cumplimiento de duración para un periodo.
 */
export const calculateDurationComplianceKPI = (
  tareas: Tarea[], 
  periodo: 'WEEK' | 'MONTH' | 'YTD'
): number => {
  const relevantTasks = getFinishedTasksByPeriod(tareas, periodo);
  if (relevantTasks.length === 0) return 0;

  const compliantTasks = relevantTasks.filter(t => checkDurationCompliance(t));
  return Math.round((compliantTasks.length / relevantTasks.length) * 100);
};

/**
 * Calcula el porcentaje de cumplimiento en fecha para un periodo.
 */
export const calculateDateComplianceKPI = (
  tareas: Tarea[],
  periodo: 'WEEK' | 'MONTH' | 'YTD'
): number => {
  const relevantTasks = getFinishedTasksByPeriod(tareas, periodo);
  if (relevantTasks.length === 0) return 0;

  const compliantTasks = relevantTasks.filter(t => checkDateCompliance(t));
  return Math.round((compliantTasks.length / relevantTasks.length) * 100);
};

/**
 * Calcula el porcentaje de cumplimiento diario de actividades para un periodo.
 */
export const calculateDailyComplianceKPI = (
  actividades: Actividad[],
  periodo: 'WEEK' | 'MONTH' | 'YTD'
): number => {
  const relevantActs = getCompletedActivitiesByPeriod(actividades, periodo);
  if (relevantActs.length === 0) return 0;

  const compliantActs = relevantActs.filter(a => checkDailyCompliance(a));
  return Math.round((compliantActs.length / relevantActs.length) * 100);
};

/**
 * Calcula el porcentaje de progreso global basado en tareas FINALIZADAS.
 */
export const calculateProjectProgress = (tareas: Tarea[]): number => {
  if (!tareas || tareas.length === 0) return 0;
  const completedCount = tareas.filter(t => t.estado === 'FINALIZADA').length;
  return Math.round((completedCount / tareas.length) * 100);
};

/**
 * Calcula un índice de eficiencia basado en actividades completadas vs iniciadas.
 */
export const calculateResourceEfficiency = (actividades: Actividad[]): number => {
  if (!actividades || actividades.length === 0) return 0;
  const startedCount = actividades.filter(a => a.isStarted).length;
  if (startedCount === 0) return 0;
  const completedCount = actividades.filter(a => a.isCompleted).length;
  return Math.round((completedCount / startedCount) * 100);
}