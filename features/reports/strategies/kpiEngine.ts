
import { Tarea, Actividad } from '../../../types/index';

/**
 * Calcula la diferencia en días entre dos fechas ISO.
 */
export const getDaysDiff = (start: string | undefined, end: string | undefined): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const checkDurationCompliance = (tarea: Tarea): boolean => {
  const { FPlaneadaInicioAct, FPlaneadaFinAct, FRealInicio, FRealFin } = tarea;
  if (!FPlaneadaInicioAct || !FPlaneadaFinAct || !FRealInicio || !FRealFin) return false;
  const pDur = getDaysDiff(FPlaneadaInicioAct, FPlaneadaFinAct);
  const rDur = getDaysDiff(FRealInicio, FRealFin);
  return (pDur - rDur) >= 0;
};

export const checkDateCompliance = (tarea: Tarea): boolean => {
  if (!tarea.FPlaneadaFinAct || !tarea.FRealFin) return false;
  return new Date(tarea.FRealFin).getTime() <= new Date(tarea.FPlaneadaFinAct).getTime();
};

export const checkDailyCompliance = (actividad: Actividad): boolean => {
  if (!actividad.FechaInicio || !actividad.FechaFinalizacion) return false;
  const start = new Date(actividad.FechaInicio);
  const end = new Date(actividad.FechaFinalizacion);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  return end.getTime() - start.getTime() <= 24 * 60 * 60 * 1000;
};

/**
 * Obtiene datos históricos formateados para Recharts.
 */
export const getHistoricalDataByDiscipline = (tareas: Tarea[], actividades: Actividad[], kpiType: 'duration' | 'date' | 'daily') => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();
  
  const result = [];

  // Disciplinas fijas
  const disciplines = [
    { id: 1, name: 'Software' },
    { id: 2, name: 'Control' },
    { id: 3, name: 'Mecánica' }
  ];

  const calculatePct = (items: any[], checker: (item: any) => boolean) => {
    if (items.length === 0) return 0;
    const compliant = items.filter(checker).length;
    return Math.round((compliant / items.length) * 100);
  };

  // Generar datos mes a mes
  for (let m = 0; m <= currentMonthIndex; m++) {
    const monthData: any = { name: months[m] };
    
    disciplines.forEach(d => {
      if (kpiType === 'daily') {
        const filteredActs = actividades.filter(a => {
          if (!a.IsCompleted || !a.FechaFinalizacion) return false;
          const date = new Date(a.FechaFinalizacion);
          const taskOfDiscipline = tareas.some(t => t.ID_Unico_Tarea === a.ID_Unico_Tarea && t.ID_Disciplina === d.id);
          return date.getMonth() === m && date.getFullYear() === currentYear && taskOfDiscipline;
        });
        monthData[d.name] = calculatePct(filteredActs, checkDailyCompliance);
      } else {
        const filteredTasks = tareas.filter(t => {
          if (t.Estado !== 'FINALIZADA' || !t.FRealFin || t.ID_Disciplina !== d.id) return false;
          const date = new Date(t.FRealFin);
          return date.getMonth() === m && date.getFullYear() === currentYear;
        });
        monthData[d.name] = calculatePct(filteredTasks, kpiType === 'duration' ? checkDurationCompliance : checkDateCompliance);
      }
    });
    result.push(monthData);
  }

  // Agregar acumulado YTD
  const ytdData: any = { name: 'YTD' };
  disciplines.forEach(d => {
    if (kpiType === 'daily') {
      const ytdActs = actividades.filter(a => {
        if (!a.IsCompleted || !a.FechaFinalizacion) return false;
        const taskOfDiscipline = tareas.some(t => t.ID_Unico_Tarea === a.ID_Unico_Tarea && t.ID_Disciplina === d.id);
        return new Date(a.FechaFinalizacion).getFullYear() === currentYear && taskOfDiscipline;
      });
      ytdData[d.name] = calculatePct(ytdActs, checkDailyCompliance);
    } else {
      const ytdTasks = tareas.filter(t => {
        return t.Estado === 'FINALIZADA' && t.FRealFin && t.ID_Disciplina === d.id && new Date(t.FRealFin).getFullYear() === currentYear;
      });
      ytdData[d.name] = calculatePct(ytdTasks, kpiType === 'duration' ? checkDurationCompliance : checkDateCompliance);
    }
  });
  result.push(ytdData);

  return result;
};

export const calculateProjectProgress = (tareas: Tarea[]): number => {
  if (!tareas || tareas.length === 0) return 0;
  const completedCount = tareas.filter(t => t.Estado === 'FINALIZADA').length;
  return Math.round((completedCount / tareas.length) * 100);
};

export const calculateBacklogHealth = (tareas: Tarea[]) => {
  if (!tareas || tareas.length === 0) {
    return {
      activeBacklog: 0,
      overdueTasks: 0,
      overdueBacklogPct: 0
    };
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const activeBacklog = tareas.filter((t) => t.Estado !== 'FINALIZADA');
  const overdueTasks = activeBacklog.filter((t) => {
    if (!t.FPlaneadaFinAct) return false;
    const plannedEnd = new Date(t.FPlaneadaFinAct);
    return !isNaN(plannedEnd.getTime()) && plannedEnd < startOfToday;
  });

  return {
    activeBacklog: activeBacklog.length,
    overdueTasks: overdueTasks.length,
    overdueBacklogPct: activeBacklog.length === 0 ? 0 : Math.round((overdueTasks.length / activeBacklog.length) * 100)
  };
};

export const calculateResourceEfficiency = (actividades: Actividad[]): number => {
  if (!actividades || actividades.length === 0) return 0;
  const startedCount = actividades.filter(a => a.IsStarted).length;
  if (startedCount === 0) return 0;
  const completedCount = actividades.filter(a => a.IsCompleted).length;
  return Math.round((completedCount / startedCount) * 100);
};

export const calculateResourceEfficiencyByPeriod = (actividades: Actividad[]) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const finishedActivities = actividades.filter((a) => {
    if (!a.FechaFinalizacion) return false;
    const finishedAt = new Date(a.FechaFinalizacion);
    return !isNaN(finishedAt.getTime()) && finishedAt < startOfToday;
  });

  const calculatePct = (subset: Actividad[]) => {
    if (subset.length === 0) return 0;
    const compliant = subset.filter(checkDailyCompliance).length;
    return Math.round((compliant / subset.length) * 100);
  };

  return {
    diario: calculatePct(
      finishedActivities.filter((a) => {
        const finishedAt = new Date(a.FechaFinalizacion!);
        return finishedAt >= startOfYesterday && finishedAt < startOfToday;
      })
    ),
    semana: calculatePct(
      finishedActivities.filter((a) => {
        const finishedAt = new Date(a.FechaFinalizacion!);
        return finishedAt >= sevenDaysAgo && finishedAt < startOfToday;
      })
    ),
    mes: calculatePct(
      finishedActivities.filter((a) => {
        const finishedAt = new Date(a.FechaFinalizacion!);
        return finishedAt >= startOfMonth && finishedAt < startOfToday;
      })
    ),
    ytd: calculatePct(
      finishedActivities.filter((a) => {
        const finishedAt = new Date(a.FechaFinalizacion!);
        return finishedAt >= startOfYear && finishedAt < startOfToday;
      })
    )
  };
};
