
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
  const { FPlaneadaIniAct, FPlaneadaFinAct, FRealIni, FRealFin } = tarea;
  if (!FPlaneadaIniAct || !FPlaneadaFinAct || !FRealIni || !FRealFin) return false;
  const pDur = getDaysDiff(FPlaneadaIniAct, FPlaneadaFinAct);
  const rDur = getDaysDiff(FRealIni, FRealFin);
  return (pDur - rDur) >= 0;
};

export const checkDateCompliance = (tarea: Tarea): boolean => {
  if (!tarea.FPlaneadaFinAct || !tarea.FRealFin) return false;
  return new Date(tarea.FRealFin).getTime() <= new Date(tarea.FPlaneadaFinAct).getTime();
};

export const checkDailyCompliance = (actividad: Actividad): boolean => {
  if (!actividad.FInicio || !actividad.FFinalizacion) return false;
  return getDaysDiff(actividad.FInicio, actividad.FFinalizacion) === 1;
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
          if (!a.isCompleted || !a.FFinalizacion) return false;
          const date = new Date(a.FFinalizacion);
          const taskOfDiscipline = tareas.some(t => t.ID_Unico_Tarea === a.ID_Tarea && t.id_disciplina === d.id);
          return date.getMonth() === m && date.getFullYear() === currentYear && taskOfDiscipline;
        });
        monthData[d.name] = calculatePct(filteredActs, checkDailyCompliance);
      } else {
        const filteredTasks = tareas.filter(t => {
          if (t.estado !== 'FINALIZADA' || !t.FRealFin || t.id_disciplina !== d.id) return false;
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
        if (!a.isCompleted || !a.FFinalizacion) return false;
        const taskOfDiscipline = tareas.some(t => t.ID_Unico_Tarea === a.ID_Tarea && t.id_disciplina === d.id);
        return new Date(a.FFinalizacion).getFullYear() === currentYear && taskOfDiscipline;
      });
      ytdData[d.name] = calculatePct(ytdActs, checkDailyCompliance);
    } else {
      const ytdTasks = tareas.filter(t => {
        return t.estado === 'FINALIZADA' && t.FRealFin && t.id_disciplina === d.id && new Date(t.FRealFin).getFullYear() === currentYear;
      });
      ytdData[d.name] = calculatePct(ytdTasks, kpiType === 'duration' ? checkDurationCompliance : checkDateCompliance);
    }
  });
  result.push(ytdData);

  return result;
};

export const calculateProjectProgress = (tareas: Tarea[]): number => {
  if (!tareas || tareas.length === 0) return 0;
  const completedCount = tareas.filter(t => t.estado === 'FINALIZADA').length;
  return Math.round((completedCount / tareas.length) * 100);
};

export const calculateResourceEfficiency = (actividades: Actividad[]): number => {
  if (!actividades || actividades.length === 0) return 0;
  const startedCount = actividades.filter(a => a.isStarted).length;
  if (startedCount === 0) return 0;
  const completedCount = actividades.filter(a => a.isCompleted).length;
  return Math.round((completedCount / startedCount) * 100);
}