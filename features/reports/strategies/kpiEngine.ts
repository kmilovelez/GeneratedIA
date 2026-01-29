
import { Tarea, Actividad } from '../../../types/index';

/**
 * Calcula la diferencia en días entre dos fechas.
 */
export const getDaysDiff = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica el cumplimiento de duración de una tarea.
 * Cumplimiento = (Duración Planeada >= Duración Real)
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

  // La regla solicitada: (Planeada - Real) >= 0 es cumplimiento.
  // Si da <= 0 y no son iguales, es incumplimiento (retraso).
  return (plannedDuration - realDuration) >= 0;
};

/**
 * Filtra y calcula el KPI de cumplimiento de duración por periodo.
 * Periodos: 'WEEK', 'MONTH', 'YTD'
 */
export const calculateDurationComplianceKPI = (tareas: Tarea[], periodo: 'WEEK' | 'MONTH' | 'YTD'): number => {
  const now = new Date();
  const finishedTasks = tareas.filter(t => t.estado === 'FINALIZADA' && t.fecha_real_fin);

  const filteredTasks = finishedTasks.filter(t => {
    const finishDate = new Date(t.fecha_real_fin!);
    switch (periodo) {
      case 'WEEK':
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        return finishDate >= lastWeek;
      case 'MONTH':
        return finishDate.getMonth() === now.getMonth() && finishDate.getFullYear() === now.getFullYear();
      case 'YTD':
        return finishDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  if (filteredTasks.length === 0) return 0;

  const compliantCount = filteredTasks.filter(t => checkDurationCompliance(t)).length;
  return Math.round((compliantCount / filteredTasks.length) * 100);
};

/**
 * Calcula el porcentaje de progreso global basado en tareas finalizadas.
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
};
