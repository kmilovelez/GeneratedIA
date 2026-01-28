
import React from 'react';
import { Calendar, AlertTriangle, Clock, CheckCircle2, CalendarCheck, CheckSquare, Timer, PlayCircle, PauseCircle, BarChart3 } from 'lucide-react';
import { Tarea, Actividad, Alerta } from '../../types/index';
import { INITIAL_DISCIPLINAS } from '../../lib/utils';

interface DashboardStatsProps {
  tareas: Tarea[];
  actividades: Actividad[];
  alertas: Alerta[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ tareas, actividades, alertas }) => {
  const finishedTasks = tareas.filter(t => t.estado === 'FINALIZADA');
  
  // Cumplimiento en Fecha
  const tasksOnTime = finishedTasks.filter(t => {
    if (!t.fecha_real_fin || !t.fecha_planeada_fin_actualizada) return false;
    return new Date(t.fecha_real_fin) <= new Date(t.fecha_planeada_fin_actualizada);
  }).length;
  const totalCumplimientoFecha = finishedTasks.length > 0 ? Math.round((tasksOnTime / finishedTasks.length) * 100) : 0;

  // Cumplimiento en Duración
  const tasksInDuration = finishedTasks.filter(t => {
    if (!t.fecha_real_inicio || !t.fecha_real_fin || !t.fecha_planeada_inicio_actualizada || !t.fecha_planeada_fin_actualizada) return false;
    const plannedDays = (new Date(t.fecha_planeada_fin_actualizada).getTime() - new Date(t.fecha_planeada_inicio_actualizada).getTime());
    const realDays = (new Date(t.fecha_real_fin).getTime() - new Date(t.fecha_real_inicio).getTime());
    return realDays <= plannedDays;
  }).length;
  const totalCumplimientoDuracion = finishedTasks.length > 0 ? Math.round((tasksInDuration / finishedTasks.length) * 100) : 0;

  // Cumplimiento Diario (Actividades de hoy)
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyActivities = actividades.filter(a => a.fecha_creacion.startsWith(todayStr));
  const finishedDaily = dailyActivities.filter(a => a.isCompleted).length;
  const totalCumplimientoDiario = dailyActivities.length > 0 ? Math.round((finishedDaily / dailyActivities.length) * 100) : 0;

  const statsByDiscipline = INITIAL_DISCIPLINAS.map(d => {
    const disciplineTasks = tareas.filter(t => t.id_disciplina === d.id);
    const wipProjectsCount = new Set(disciplineTasks.filter(t => t.estado === 'WIP').map(t => t.id_proyecto)).size;
    const deckProjectsCount = new Set(disciplineTasks.filter(t => t.estado === 'DECK').map(t => t.id_proyecto)).size;
    
    return {
      name: d.nombre,
      wipProjects: wipProjectsCount,
      deckProjects: deckProjectsCount,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
          <p className="text-slate-500">Indicadores de Disciplina y Cumplimiento de Metas</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
            <Calendar size={14} /> {new Date().toLocaleDateString()}
          </span>
        </div>
      </header>

      {/* 1. Alertas Tempranas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col w-full">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
            <AlertTriangle size={16} className="text-amber-500" /> Alertas Tempranas
          </h4>
          <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full">{alertas.length} ACTIVAS</span>
        </div>
        <div className="p-4 overflow-y-auto max-h-[160px]">
          {alertas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alertas.map(a => (
                <div key={a.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg flex gap-3 items-start">
                  <div className="mt-0.5"><Clock size={14} className="text-amber-500" /></div>
                  <div>
                    <p className="text-xs font-bold text-amber-800">{a.tipo === 'retraso_inicio' ? 'Retraso en Inicio' : 'Riesgo de Finalización'}</p>
                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">{a.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 py-6 text-center">
              <CheckCircle2 size={32} className="mb-2 opacity-20 mx-auto" />
              <p className="text-xs">No hay alertas activas en este momento</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. KPIs de Cumplimiento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-indigo-300 transition-colors">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">CUMPLIMIENTO EN FECHA</h3>
            <div className="p-1 bg-white rounded shadow-xs text-indigo-400"><CalendarCheck size={14} /></div>
          </div>
          <div className="p-6">
            <span className="text-3xl font-black text-slate-800 leading-none">{totalCumplimientoFecha}%</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Promedio Total de Tareas</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-300 transition-colors">
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest">CUMPLIMIENTO DIARIO</h3>
            <div className="p-1 bg-white rounded shadow-xs text-blue-400"><CheckSquare size={14} /></div>
          </div>
          <div className="p-6">
            <span className="text-3xl font-black text-slate-800 leading-none">{totalCumplimientoDiario}%</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Actividades de Hoy</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-emerald-300 transition-colors">
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">CUMPLIMIENTO EN DURACIÓN</h3>
            <div className="p-1 bg-white rounded shadow-xs text-emerald-400"><Timer size={14} /></div>
          </div>
          <div className="p-6">
            <span className="text-3xl font-black text-slate-800 leading-none">{totalCumplimientoDuracion}%</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Comparativa Plan vs Real</p>
          </div>
        </div>
      </div>

      {/* 3. Conteo WIP/DECK por Disciplina */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsByDiscipline.map(d => (
          <div key={d.name} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-300 transition-colors">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[80%]">{d.name}</h3>
              <div className="p-1 bg-white rounded shadow-xs"><BarChart3 size={14} className="text-slate-400" /></div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                  <PlayCircle size={14} />
                  <span className="text-[10px] font-bold uppercase">WIP</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-800 leading-none">{d.wipProjects}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Proyectos</span>
                </div>
              </div>
              <div className="space-y-1 border-l border-slate-100 pl-4">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <PauseCircle size={14} />
                  <span className="text-[10px] font-bold uppercase">DECK</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-500 leading-none">{d.deckProjects}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Proyectos</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
