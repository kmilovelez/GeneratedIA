
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
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  
  // Fix: Property name changed to FRealFin
  const finishedTasks = tareas.filter(t => t.estado === 'FINALIZADA' && t.FRealFin);
  
  // KPI 1: Cumplimiento en Fecha
  const tasksOnTime = finishedTasks.filter(t => {
    // Fix: Property names changed to FRealFin and FPlaneadaFinAct
    if (!t.FRealFin || !t.FPlaneadaFinAct) return false;
    return new Date(t.FRealFin) <= new Date(t.FPlaneadaFinAct);
  }).length;
  const totalCumplimientoFecha = finishedTasks.length > 0 ? Math.round((tasksOnTime / finishedTasks.length) * 100) : 0;

  // KPI 2: Cumplimiento Diario (Basado en Actividades de Hoy)
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyActivities = actividades.filter(a => a.fecha_creacion.startsWith(todayStr));
  const finishedDaily = dailyActivities.filter(a => a.isCompleted).length;
  const totalCumplimientoDiario = dailyActivities.length > 0 ? Math.round((finishedDaily / dailyActivities.length) * 100) : 0;

  // KPI 3: Cumplimiento Duración
  const tasksInDuration = finishedTasks.filter(t => {
    // Fix: Property names changed to match Tarea type
    if (!t.FRealIni || !t.FRealFin || !t.FPlaneadaIniAct || !t.FPlaneadaFinAct) return false;
    const plannedDays = (new Date(t.FPlaneadaFinAct).getTime() - new Date(t.FPlaneadaIniAct).getTime());
    const realDays = (new Date(t.FRealFin).getTime() - new Date(t.FRealIni).getTime());
    return realDays <= plannedDays;
  }).length;
  const totalCumplimientoDuracion = finishedTasks.length > 0 ? Math.round((tasksInDuration / finishedTasks.length) * 100) : 0;

  // Lógica de fechas comunes para desgloses
  const timeRefs = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return { oneWeekAgo, startOfMonth, startOfYear };
  }, []);

  // 1. Desglose Cumplimiento en Fecha
  const complianceBreakdown = useMemo(() => {
    const calculatePct = (subset: Tarea[]) => {
      if (subset.length === 0) return 0;
      // Fix: Property names changed to FRealFin and FPlaneadaFinAct
      const onTime = subset.filter(t => new Date(t.FRealFin!) <= new Date(t.FPlaneadaFinAct)).length;
      return Math.round((onTime / subset.length) * 100);
    };

    return INITIAL_DISCIPLINAS.map(d => {
      const disciplineTasks = finishedTasks.filter(t => t.id_disciplina === d.id);
      return {
        id: d.id,
        nombre: d.nombre,
        // Fix: Property name changed to FRealFin
        semana: calculatePct(disciplineTasks.filter(t => new Date(t.FRealFin!) >= timeRefs.oneWeekAgo)),
        mes: calculatePct(disciplineTasks.filter(t => new Date(t.FRealFin!) >= timeRefs.startOfMonth)),
        ytd: calculatePct(disciplineTasks.filter(t => new Date(t.FRealFin!) >= timeRefs.startOfYear)),
        count: disciplineTasks.length
      };
    });
  }, [finishedTasks, timeRefs]);

  // 2. Desglose Cumplimiento Diario (Actividades)
  const dailyBreakdown = useMemo(() => {
    const calculatePct = (subset: Actividad[]) => {
      if (subset.length === 0) return 0;
      const done = subset.filter(a => a.isCompleted).length;
      return Math.round((done / subset.length) * 100);
    };

    return INITIAL_DISCIPLINAS.map(d => {
      // Filtrar actividades cuyas tareas pertenezcan a esta disciplina
      // Fix: Tarea uses ID_Unico_Tarea and Actividad uses ID_Tarea
      const taskIds = new Set(tareas.filter(t => t.id_disciplina === d.id).map(t => t.ID_Unico_Tarea));
      const disciplineActs = actividades.filter(a => taskIds.has(a.ID_Tarea));
      
      return {
        id: d.id,
        nombre: d.nombre,
        semana: calculatePct(disciplineActs.filter(a => new Date(a.fecha_creacion) >= timeRefs.oneWeekAgo)),
        mes: calculatePct(disciplineActs.filter(a => new Date(a.fecha_creacion) >= timeRefs.startOfMonth)),
        ytd: calculatePct(disciplineActs.filter(a => new Date(a.fecha_creacion) >= timeRefs.startOfYear)),
        count: disciplineActs.length
      };
    });
  }, [actividades, tareas, timeRefs]);

  // 3. Desglose Cumplimiento Duración
  const durationBreakdown = useMemo(() => {
    const calculatePct = (subset: Tarea[]) => {
      if (subset.length === 0) return 0;
      const inDur = subset.filter(t => {
        // Fix: Property names changed to FRealIni and FRealFin
        if (!t.FRealIni || !t.FRealFin) return false;
        // Fix: Property names changed to FPlaneadaFinAct and FPlaneadaIniAct
        const planned = new Date(t.FPlaneadaFinAct).getTime() - new Date(t.FPlaneadaIniAct).getTime();
        const real = new Date(t.FRealFin).getTime() - new Date(t.FRealIni).getTime();
        return real <= planned;
      }).length;
      return Math.round((inDur / subset.length) * 100);
    };

    return INITIAL_DISCIPLINAS.map(d => {
      const disciplineTasks = finishedTasks.filter(t => t.id_disciplina === d.id);
      return {
        id: d.id,
        nombre: d.nombre,
        // Fix: Property name changed to FRealFin
        semana: calculatePct(disciplineTasks.filter(t => new Date(t.FRealFin!) >= timeRefs.oneWeekAgo)),
        mes: calculatePct(disciplineTasks.filter(t => new Date(t.FRealFin!) >= timeRefs.startOfMonth)),
        ytd: calculatePct(disciplineTasks.filter(t => new Date(t.FRealFin!) >= timeRefs.startOfYear)),
        count: disciplineTasks.length
      };
    });
  }, [finishedTasks, timeRefs]);

  const statsByDiscipline = INITIAL_DISCIPLINAS.map(d => {
    const disciplineTasks = tareas.filter(t => t.id_disciplina === d.id);
    // Fix: Tarea uses OT to link to Proyecto
    const wipProjectsCount = new Set(disciplineTasks.filter(t => t.estado === 'WIP').map(t => t.OT)).size;
    const deckProjectsCount = new Set(disciplineTasks.filter(t => t.estado === 'DECK').map(t => t.OT)).size;
    
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
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 font-medium">Indicadores estratégicos de cumplimiento</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-2xl border shadow-sm">
            <Calendar size={14} className="text-blue-500" /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </header>

      {/* 1. Alertas Tempranas */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col w-full overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
            <AlertTriangle size={16} className="text-amber-500" /> Alertas Críticas
          </h4>
          <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full border border-amber-200">{alertas.length} ACTIVAS</span>
        </div>
        <div className="p-6 overflow-y-auto max-h-[200px] custom-scrollbar">
          {alertas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alertas.map(a => (
                <div key={a.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex gap-4 items-start shadow-sm hover:border-amber-200 transition-colors">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{a.tipo === 'retraso_inicio' ? 'Retraso en Inicio' : 'Riesgo de Finalización'}</p>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">{a.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 py-10 text-center">
              <CheckCircle2 size={40} className="mb-3 opacity-10 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Operación sin desviaciones críticas</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. KPIs de Cumplimiento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Cumplimiento en Fecha */}
        <div 
          onClick={() => setIsComplianceModalOpen(true)}
          className="bg-white rounded-[2rem] border-2 border-transparent hover:border-indigo-200 shadow-sm overflow-hidden flex flex-col group transition-all cursor-pointer active:scale-95"
        >
          <div className="p-5 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center group-hover:bg-indigo-50 transition-colors">
            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em]">CUMPLIMIENTO EN FECHA</h3>
            <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500 group-hover:rotate-12 transition-transform"><CalendarCheck size={18} /></div>
          </div>
          <div className="p-8 flex items-end justify-between">
            <div>
              <span className="text-4xl font-black text-slate-800 leading-none">{totalCumplimientoFecha}%</span>
              <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-widest flex items-center gap-1">
                Ver Detalles <ChevronRight size={10} />
              </p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-500 rotate-45"></div>
          </div>
        </div>

        {/* KPI 2: Cumplimiento Diario */}
        <div 
          onClick={() => setIsDailyModalOpen(true)}
          className="bg-white rounded-[2rem] border-2 border-transparent border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-300 transition-all cursor-pointer active:scale-95"
        >
          <div className="p-5 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
            <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em]">CUMPLIMIENTO DIARIO</h3>
            <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500 group-hover:scale-110 transition-transform"><CheckSquare size={18} /></div>
          </div>
          <div className="p-8 flex items-end justify-between">
            <div>
              <span className="text-4xl font-black text-slate-800 leading-none">{totalCumplimientoDiario}%</span>
              <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-widest flex items-center gap-1">
                Ver Detalles <ChevronRight size={10} />
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
               <Timer size={24} />
            </div>
          </div>
        </div>

        {/* KPI 3: Cumplimiento Duración */}
        <div 
          onClick={() => setIsDurationModalOpen(true)}
          className="bg-white rounded-[2rem] border-2 border-transparent border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-emerald-300 transition-all cursor-pointer active:scale-95"
        >
          <div className="p-5 bg-emerald-50/50 border-b border-emerald-100 flex justify-between items-center group-hover:bg-emerald-50 transition-colors">
            <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">CUMPLIMIENTO DURACIÓN</h3>
            <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500 group-hover:rotate-12 transition-transform"><Timer size={18} /></div>
          </div>
          <div className="p-8 flex items-end justify-between">
            <div>
              <span className="text-4xl font-black text-slate-800 leading-none">{totalCumplimientoDuracion}%</span>
              <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-widest flex items-center gap-1">
                Ver Detalles <ChevronRight size={10} />
              </p>
            </div>
            <div className="w-16 h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${totalCumplimientoDuracion}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Conteo WIP/DECK por Disciplina */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsByDiscipline.map(d => (
          <div key={d.name} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-400/50 transition-all hover:shadow-xl hover:shadow-slate-200/50">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] truncate max-w-[80%]">{d.name}</h3>
              <div className="p-2 bg-white rounded-xl shadow-xs"><BarChart3 size={16} className="text-slate-400" /></div>
            </div>
            <div className="p-8 grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <PlayCircle size={16} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">WIP</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-800 leading-none">{d.wipProjects}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Proyectos Activos</span>
                </div>
              </div>
              <div className="space-y-2 border-l border-slate-100 pl-6">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <PauseCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">DECK</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-500 leading-none">{d.deckProjects}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">En Espera</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RENDERIZADO DE MODALES */}
      
      {/* 1. Modal: Desglose de Cumplimiento en Fecha */}
      <ComplianceDetailModal 
        isOpen={isComplianceModalOpen} 
        onClose={() => setIsComplianceModalOpen(false)} 
        title="Métricas de Cumplimiento en Fecha"
        data={complianceBreakdown}
        colorClass="indigo"
        icon={<CalendarCheck size={28} strokeWidth={3} />}
        helpText="Comparativa de Fecha Real vs Fecha Planeada Actualizada para tareas FINALIZADAS."
      />

      {/* 2. Modal: Desglose de Cumplimiento Diario */}
      <ComplianceDetailModal 
        isOpen={isDailyModalOpen} 
        onClose={() => setIsDailyModalOpen(false)} 
        title="Métricas de Cumplimiento Diario"
        data={dailyBreakdown}
        colorClass="blue"
        icon={<CheckSquare size={28} strokeWidth={3} />}
        helpText="Porcentaje de actividades completadas frente al total de actividades creadas por disciplina."
      />

      {/* 3. Modal: Desglose de Cumplimiento en Duración */}
      <ComplianceDetailModal 
        isOpen={isDurationModalOpen} 
        onClose={() => setIsDurationModalOpen(false)} 
        title="Métricas de Cumplimiento en Duración"
        data={durationBreakdown}
        colorClass="emerald"
        icon={<Timer size={28} strokeWidth={3} />}
        helpText="Cumplimiento basado en el tiempo de ejecución real frente a la duración planeada del hito."
      />
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  colorClass: 'indigo' | 'blue' | 'emerald';
  icon: React.ReactNode;
  helpText: string;
}

const ComplianceDetailModal: React.FC<ModalProps> = ({ isOpen, onClose, title, data, colorClass, icon, helpText }) => {
  if (!isOpen) return null;

  const accentColors = {
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', hover: 'hover:text-indigo-600', border: 'border-indigo-100', bgLight: 'bg-indigo-50/50' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:text-blue-600', border: 'border-blue-100', bgLight: 'bg-blue-50/50' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', hover: 'hover:text-emerald-600', border: 'border-emerald-100', bgLight: 'bg-emerald-50/50' },
  };

  const colors = accentColors[colorClass];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
              {icon}
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{title}</h4>
              <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Desglose por Disciplina y Periodo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-10 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr>
                  <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Disciplina</th>
                  <th className={`px-6 py-2 text-[10px] font-black ${colors.text} uppercase tracking-[0.3em] text-center ${colors.bgLight} rounded-l-xl`}>Semana</th>
                  <th className={`px-6 py-2 text-[10px] font-black ${colors.text} uppercase tracking-[0.3em] text-center ${colors.bgLight}`}>Mes</th>
                  <th className={`px-6 py-2 text-[10px] font-black ${colors.text} uppercase tracking-[0.3em] text-center ${colors.bgLight} rounded-r-xl`}>YTD</th>
                  <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Volumen</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <span className={`text-sm font-black text-slate-800 tracking-tight ${colors.hover} transition-colors`}>{row.nombre}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xl font-black ${row.semana >= 80 ? colors.text : 'text-slate-800'}`}>{row.semana}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`${colors.bg} h-full rounded-full`} style={{ width: `${row.semana}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xl font-black ${row.mes >= 80 ? colors.text : 'text-slate-800'}`}>{row.mes}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`${colors.bg} h-full rounded-full`} style={{ width: `${row.mes}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xl font-black ${row.ytd >= 80 ? colors.text : 'text-slate-800'}`}>{row.ytd}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`${colors.bg} h-full rounded-full`} style={{ width: `${row.ytd}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{row.count} ítems</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className={`mt-10 p-6 ${colors.bgLight} rounded-3xl border ${colors.border} flex items-center gap-4`}>
            <AlertTriangle size={24} className="text-slate-400 shrink-0" />
            <p className={`text-xs ${colors.text} font-bold leading-relaxed`}>
              {helpText}
            </p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
