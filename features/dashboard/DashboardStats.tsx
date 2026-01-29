
import React, { useState, useMemo } from 'react';
import { Calendar, AlertTriangle, Clock, CheckCircle2, CalendarCheck, CheckSquare, Timer, PlayCircle, PauseCircle, BarChart3, X, ChevronRight } from 'lucide-react';
import { Tarea, Actividad, Alerta } from '../../types/index';
import { INITIAL_DISCIPLINAS } from '../../lib/utils';

interface DashboardStatsProps {
  tareas: Tarea[];
  actividades: Actividad[];
  alertas: Alerta[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ tareas, actividades, alertas }) => {
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  
  const finishedTasks = tareas.filter(t => t.estado === 'FINALIZADA' && t.FRealFin);
  
  // KPI 1: Cumplimiento en Fecha
  const tasksOnTime = finishedTasks.filter(t => {
    if (!t.FRealFin || !t.FPlaneadaFinAct) return false;
    return new Date(t.FRealFin) <= new Date(t.FPlaneadaFinAct);
  }).length;
  const totalCumplimientoFecha = finishedTasks.length > 0 ? Math.round((tasksOnTime / finishedTasks.length) * 100) : 0;

  // KPI 2: Cumplimiento Diario
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyActivities = actividades.filter(a => a.fecha_creacion.startsWith(todayStr));
  const finishedDaily = dailyActivities.filter(a => a.IsCompleted).length;
  const totalCumplimientoDiario = dailyActivities.length > 0 ? Math.round((finishedDaily / dailyActivities.length) * 100) : 0;

  // KPI 3: Cumplimiento Duración
  const tasksInDuration = finishedTasks.filter(t => {
    if (!t.FRealInicio || !t.FRealFin || !t.FPlaneadaInicioAct || !t.FPlaneadaFinAct) return false;
    const pDur = new Date(t.FPlaneadaFinAct).getTime() - new Date(t.FPlaneadaInicioAct).getTime();
    const rDur = new Date(t.FRealFin).getTime() - new Date(t.FRealInicio).getTime();
    return rDur <= pDur;
  }).length;
  const totalCumplimientoDuracion = finishedTasks.length > 0 ? Math.round((tasksInDuration / finishedTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 font-medium">Indicadores estratégicos corporativos</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] border-2 border-transparent p-8 shadow-sm flex flex-col justify-between group hover:border-blue-500 transition-all cursor-pointer">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">CUMPLIMIENTO FECHA</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-slate-800">{totalCumplimientoFecha}%</span>
            <CalendarCheck size={32} className="text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm flex flex-col justify-between group hover:border-emerald-500 border-2 border-transparent transition-all cursor-pointer">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">CUMPLIMIENTO DIARIO</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-slate-800">{totalCumplimientoDiario}%</span>
            <CheckSquare size={32} className="text-emerald-500" />
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm flex flex-col justify-between group hover:border-amber-500 border-2 border-transparent transition-all cursor-pointer">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">EFICIENCIA DURACIÓN</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black text-slate-800">{totalCumplimientoDuracion}%</span>
            <Timer size={32} className="text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
