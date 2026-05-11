import React, { useMemo, useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarCheck,
  CheckSquare,
  Timer,
  PlayCircle,
  PauseCircle,
  BarChart3,
  X,
  ChevronRight,
  Layers,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Actividad, ProjectStatus, Proyecto, Tarea } from '../../types/index';
import { INITIAL_DISCIPLINAS } from '../../lib/utils';
import { calculateBacklogHealth, calculateResourceEfficiencyByPeriod, checkDailyCompliance } from '../reports/strategies/kpiEngine';

interface DashboardStatsProps {
  tareas: Tarea[];
  actividades: Actividad[];
  proyectos: Proyecto[];
}

type GeneratedAlert = {
  key: string;
  kind: 'retrasada' | 'riesgo_cumplimiento';
  ot: string;
  disciplina: string;
  tarea: string;
  label: string;
};

type DisciplineProjectDetail = {
  ot: string;
  title: string;
  status: 'WIP' | 'FROZEN' | 'DECK';
  taskCount: number;
};

type DisciplineStatusSummary = {
  id: number;
  name: string;
  wipProjects: number;
  frozenProjects: number;
  deckProjects: number;
  details: Record<'WIP' | 'FROZEN' | 'DECK', DisciplineProjectDetail[]>;
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ tareas, actividades, proyectos }) => {
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [isBacklogHealthModalOpen, setIsBacklogHealthModalOpen] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineStatusSummary | null>(null);

  const finishedTasks = tareas.filter((t) => t.Estado === 'FINALIZADA' && t.FRealFin);
  const backlogHealth = useMemo(() => calculateBacklogHealth(tareas), [tareas]);
  const operationalEfficiency = useMemo(() => calculateResourceEfficiencyByPeriod(actividades), [actividades]);

  const backlogHealthBreakdown = useMemo(
    () =>
      INITIAL_DISCIPLINAS.map((d) => ({
        id: d.id,
        nombre: d.nombre,
        ...calculateBacklogHealth(tareas.filter((t) => t.ID_Disciplina === d.id))
      })),
    [tareas]
  );

  const tasksOnTime = finishedTasks.filter((t) => {
    if (!t.FRealFin || !t.FPlaneadaFinAct) return false;
    return new Date(t.FRealFin) <= new Date(t.FPlaneadaFinAct);
  }).length;
  const totalCumplimientoFecha = finishedTasks.length > 0 ? Math.round((tasksOnTime / finishedTasks.length) * 100) : 0;

  const compliantDaily = actividades.filter((a) => checkDailyCompliance(a)).length;
  const totalCumplimientoDiario = actividades.length > 0 ? Math.round((compliantDaily / actividades.length) * 100) : 0;

  const tasksInDuration = finishedTasks.filter((t) => {
    if (!t.FRealInicio || !t.FRealFin || !t.FPlaneadaInicioAct || !t.FPlaneadaFinAct) return false;
    const plannedDays = new Date(t.FPlaneadaFinAct).getTime() - new Date(t.FPlaneadaInicioAct).getTime();
    const realDays = new Date(t.FRealFin).getTime() - new Date(t.FRealInicio).getTime();
    return realDays <= plannedDays;
  }).length;
  const totalCumplimientoDuracion = finishedTasks.length > 0 ? Math.round((tasksInDuration / finishedTasks.length) * 100) : 0;

  const timeRefs = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return { oneWeekAgo, startOfMonth, startOfYear };
  }, []);

  const complianceBreakdown = useMemo(() => {
    const calculatePct = (subset: Tarea[]) => {
      if (subset.length === 0) return 0;
      const onTime = subset.filter((t) => new Date(t.FRealFin!) <= new Date(t.FPlaneadaFinAct)).length;
      return Math.round((onTime / subset.length) * 100);
    };

    return INITIAL_DISCIPLINAS.map((d) => {
      const disciplineTasks = finishedTasks.filter((t) => t.ID_Disciplina === d.id);
      return {
        id: d.id,
        nombre: d.nombre,
        semana: calculatePct(disciplineTasks.filter((t) => new Date(t.FRealFin!) >= timeRefs.oneWeekAgo)),
        mes: calculatePct(disciplineTasks.filter((t) => new Date(t.FRealFin!) >= timeRefs.startOfMonth)),
        ytd: calculatePct(disciplineTasks.filter((t) => new Date(t.FRealFin!) >= timeRefs.startOfYear)),
        count: disciplineTasks.length
      };
    });
  }, [finishedTasks, timeRefs]);

  const dailyBreakdown = useMemo(() => {
    const calculatePct = (subset: Actividad[]) => {
      if (subset.length === 0) return 0;
      const compliant = subset.filter((a) => checkDailyCompliance(a)).length;
      return Math.round((compliant / subset.length) * 100);
    };

    return INITIAL_DISCIPLINAS.map((d) => {
      const taskIds = new Set(tareas.filter((t) => t.ID_Disciplina === d.id).map((t) => t.ID_Unico_Tarea));
      const disciplineActs = actividades.filter((a) => taskIds.has(a.ID_Unico_Tarea));

      return {
        id: d.id,
        nombre: d.nombre,
        semana: calculatePct(disciplineActs.filter((a) => new Date(a.fecha_creacion) >= timeRefs.oneWeekAgo)),
        mes: calculatePct(disciplineActs.filter((a) => new Date(a.fecha_creacion) >= timeRefs.startOfMonth)),
        ytd: calculatePct(disciplineActs.filter((a) => new Date(a.fecha_creacion) >= timeRefs.startOfYear)),
        count: disciplineActs.length
      };
    });
  }, [actividades, tareas, timeRefs]);

  const durationBreakdown = useMemo(() => {
    const calculatePct = (subset: Tarea[]) => {
      if (subset.length === 0) return 0;
      const inDur = subset.filter((t) => {
        if (!t.FRealInicio || !t.FRealFin) return false;
        const planned = new Date(t.FPlaneadaFinAct).getTime() - new Date(t.FPlaneadaInicioAct).getTime();
        const real = new Date(t.FRealFin).getTime() - new Date(t.FRealInicio).getTime();
        return real <= planned;
      }).length;
      return Math.round((inDur / subset.length) * 100);
    };

    return INITIAL_DISCIPLINAS.map((d) => {
      const disciplineTasks = finishedTasks.filter((t) => t.ID_Disciplina === d.id);
      return {
        id: d.id,
        nombre: d.nombre,
        semana: calculatePct(disciplineTasks.filter((t) => new Date(t.FRealFin!) >= timeRefs.oneWeekAgo)),
        mes: calculatePct(disciplineTasks.filter((t) => new Date(t.FRealFin!) >= timeRefs.startOfMonth)),
        ytd: calculatePct(disciplineTasks.filter((t) => new Date(t.FRealFin!) >= timeRefs.startOfYear)),
        count: disciplineTasks.length
      };
    });
  }, [finishedTasks, timeRefs]);

  const generatedAlerts = useMemo<GeneratedAlert[]>(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return tareas
      .flatMap((task) => {
        const project = proyectos.find((item) => item.OT === task.OT);
        const discipline = INITIAL_DISCIPLINAS.find((item) => item.id === task.ID_Disciplina)?.nombre || 'N/A';
        const projectIsOperational = project?.Estado === 'DECK' || project?.Estado === 'WIP';
        const plannedStart = task.FPlaneadaInicioAct ? new Date(task.FPlaneadaInicioAct) : null;
        const plannedFinish = task.FPlaneadaFinAct ? new Date(task.FPlaneadaFinAct) : null;
        const expectedFinish = task.FEsperadaFin ? new Date(task.FEsperadaFin) : null;

        const delayedStart =
          task.Estado === 'DECK' &&
          projectIsOperational &&
          plannedStart !== null &&
          !isNaN(plannedStart.getTime()) &&
          plannedStart < startOfToday;

        const completionRisk =
          !delayedStart &&
          task.Estado === 'WIP' &&
          projectIsOperational &&
          plannedFinish !== null &&
          expectedFinish !== null &&
          !isNaN(plannedFinish.getTime()) &&
          !isNaN(expectedFinish.getTime()) &&
          expectedFinish > plannedFinish;

        const alertsForTask: GeneratedAlert[] = [];

        if (delayedStart) {
          alertsForTask.push({
            key: `late-start-${task.id}`,
            kind: 'retrasada',
            ot: task.OT,
            disciplina: discipline,
            tarea: task.Title,
            label: 'retrasada'
          });
        }

        if (completionRisk) {
          alertsForTask.push({
            key: `delivery-risk-${task.id}`,
            kind: 'riesgo_cumplimiento',
            ot: task.OT,
            disciplina: discipline,
            tarea: task.Title,
            label: 'riesgo de cumplimiento'
          });
        }

        return alertsForTask;
      })
      .sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'retrasada' ? -1 : 1;
        }
        return a.ot.localeCompare(b.ot) || a.tarea.localeCompare(b.tarea);
      });
  }, [proyectos, tareas]);

  const statsByDiscipline = useMemo<DisciplineStatusSummary[]>(
    () =>
      INITIAL_DISCIPLINAS.map((d) => {
        const disciplineTasks = tareas.filter((t) => t.ID_Disciplina === d.id);
        const projectDetails = disciplineTasks.reduce<Record<string, DisciplineProjectDetail>>((acc, task) => {
          if (!['WIP', 'FROZEN', 'DECK'].includes(task.Estado)) {
            return acc;
          }

          if (!acc[task.OT]) {
            const project = proyectos.find((item) => item.OT === task.OT);
            acc[task.OT] = {
              ot: task.OT,
              title: project?.Title || `Proyecto ${task.OT}`,
              status: task.Estado as 'WIP' | 'FROZEN' | 'DECK',
              taskCount: 0
            };
          }

          acc[task.OT].taskCount += 1;

          if (task.Estado === 'WIP') {
            acc[task.OT].status = 'WIP';
          } else if (task.Estado === 'FROZEN' && acc[task.OT].status !== 'WIP') {
            acc[task.OT].status = 'FROZEN';
          } else if (acc[task.OT].status !== 'WIP' && acc[task.OT].status !== 'FROZEN') {
            acc[task.OT].status = 'DECK';
          }

          return acc;
        }, {});

        const details = {
          WIP: Object.values(projectDetails)
            .filter((item) => item.status === 'WIP')
            .sort((a, b) => a.title.localeCompare(b.title)),
          FROZEN: Object.values(projectDetails)
            .filter((item) => item.status === 'FROZEN')
            .sort((a, b) => a.title.localeCompare(b.title)),
          DECK: Object.values(projectDetails)
            .filter((item) => item.status === 'DECK')
            .sort((a, b) => a.title.localeCompare(b.title))
        };

        return {
          id: d.id,
          name: d.nombre,
          wipProjects: details.WIP.length,
          frozenProjects: details.FROZEN.length,
          deckProjects: details.DECK.length,
          details
        };
      }),
    [proyectos, tareas]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 font-medium">Indicadores estrategicos de cumplimiento</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-2xl border shadow-sm">
            <Calendar size={14} className="text-blue-500" />{' '}
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col w-full overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
            <AlertTriangle size={16} className="text-amber-500" /> Alertas Criticas
          </h4>
          <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full border border-amber-200">{generatedAlerts.length} ACTIVAS</span>
        </div>
        <div className="p-6 overflow-y-auto max-h-[200px] custom-scrollbar">
          {generatedAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedAlerts.map((alert) => (
                <div key={alert.key} className="p-4 bg-white border border-slate-100 rounded-2xl flex gap-4 items-start shadow-sm hover:border-amber-200 transition-colors">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                      {alert.kind === 'retrasada' ? 'Retraso en Inicio' : 'Riesgo de Cumplimiento'}
                    </p>
                    <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
                      {alert.ot} {alert.disciplina} {alert.tarea}{' '}
                      <span className="text-red-600 uppercase">{alert.label}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 py-10 text-center">
              <CheckCircle2 size={40} className="mb-3 opacity-10 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Operacion sin desviaciones criticas</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => setIsComplianceModalOpen(true)} className="bg-white rounded-[2rem] border-2 border-transparent hover:border-indigo-200 shadow-sm overflow-hidden flex flex-col group transition-all cursor-pointer active:scale-95">
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

        <div onClick={() => setIsDurationModalOpen(true)} className="bg-white rounded-[2rem] border-2 border-transparent border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-emerald-300 transition-all cursor-pointer active:scale-95">
          <div className="p-5 bg-emerald-50/50 border-b border-emerald-100 flex justify-between items-center group-hover:bg-emerald-50 transition-colors">
            <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">CUMPLIMIENTO DURACION</h3>
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

        <div onClick={() => setIsDailyModalOpen(true)} className="bg-white rounded-[2rem] border-2 border-transparent border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-300 transition-all cursor-pointer active:scale-95">
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
          onClick={() => setIsBacklogHealthModalOpen(true)}
          className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-50 transition-all duration-500 cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
              <TrendingUp size={32} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Salud del Backlog</p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activo</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{backlogHealth.activeBacklog}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vencidas</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{backlogHealth.overdueTasks}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">% Vencido</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{backlogHealth.overdueBacklogPct}%</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase mt-5 tracking-widest flex items-center gap-1">
                Ver Detalles <ChevronRight size={10} />
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-500">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
              <Zap size={32} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Eficiencia Operativa</p>
              <div className="grid grid-cols-4 gap-4 mt-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diario</p>
                  <p className="text-2xl font-black text-slate-800">{operationalEfficiency.diario}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semana</p>
                  <p className="text-2xl font-black text-slate-800">{operationalEfficiency.semana}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mes</p>
                  <p className="text-2xl font-black text-slate-800">{operationalEfficiency.mes}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">YTD</p>
                  <p className="text-2xl font-black text-slate-800">{operationalEfficiency.ytd}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsByDiscipline.map((d) => (
          <div
            key={d.name}
            onClick={() => setSelectedDiscipline(d)}
            className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-400/50 transition-all hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer active:scale-[0.99]"
          >
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] truncate max-w-[80%]">{d.name}</h3>
              <div className="p-2 bg-white rounded-xl shadow-xs"><BarChart3 size={16} className="text-slate-400" /></div>
            </div>
            <div className="p-8 grid grid-cols-3 gap-6">
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
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <PauseCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">FROZEN</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-amber-600 leading-none">{d.frozenProjects}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Congelados</span>
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
            <div className="px-8 pb-6">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                Ver Detalles <ChevronRight size={10} />
              </p>
            </div>
          </div>
        ))}
      </div>

      <ComplianceDetailModal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        title="Metricas de Cumplimiento en Fecha"
        data={complianceBreakdown}
        colorClass="indigo"
        icon={<CalendarCheck size={28} strokeWidth={3} />}
        helpText="Comparativa de Fecha Real vs Fecha Planeada Actualizada para tareas FINALIZADAS."
      />

      <ComplianceDetailModal
        isOpen={isDailyModalOpen}
        onClose={() => setIsDailyModalOpen(false)}
        title="Metricas de Cumplimiento Diario"
        data={dailyBreakdown}
        colorClass="blue"
        icon={<CheckSquare size={28} strokeWidth={3} />}
        helpText="Porcentaje de actividades cuya fecha real de finalizacion menos la fecha real de inicio es menor o igual a 24 horas."
      />

      <ComplianceDetailModal
        isOpen={isDurationModalOpen}
        onClose={() => setIsDurationModalOpen(false)}
        title="Metricas de Cumplimiento en Duracion"
        data={durationBreakdown}
        colorClass="emerald"
        icon={<Timer size={28} strokeWidth={3} />}
        helpText="Cumplimiento basado en el tiempo de ejecucion real frente a la duracion planeada del hito."
      />

      <BacklogHealthModal
        isOpen={isBacklogHealthModalOpen}
        onClose={() => setIsBacklogHealthModalOpen(false)}
        data={backlogHealthBreakdown}
      />

      <DisciplineProjectsModal discipline={selectedDiscipline} onClose={() => setSelectedDiscipline(null)} />
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Array<{ id: number; nombre: string; semana: number; mes: number; ytd: number; count: number }>;
  colorClass: 'indigo' | 'blue' | 'emerald';
  icon: React.ReactNode;
  helpText: string;
}

const ComplianceDetailModal: React.FC<ModalProps> = ({ isOpen, onClose, title, data, colorClass, icon, helpText }) => {
  if (!isOpen) return null;

  const accentColors = {
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', hover: 'hover:text-indigo-600', border: 'border-indigo-100', bgLight: 'bg-indigo-50/50' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:text-blue-600', border: 'border-blue-100', bgLight: 'bg-blue-50/50' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', hover: 'hover:text-emerald-600', border: 'border-emerald-100', bgLight: 'bg-emerald-50/50' }
  };

  const colors = accentColors[colorClass];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center text-white shadow-xl`}>{icon}</div>
            <div>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{title}</h4>
              <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Desglose por Disciplina y Periodo</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90">
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
                      <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{row.count} items</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`mt-10 p-6 ${colors.bgLight} rounded-3xl border ${colors.border} flex items-center gap-4`}>
            <AlertTriangle size={24} className="text-slate-400 shrink-0" />
            <p className={`text-xs ${colors.text} font-bold leading-relaxed`}>{helpText}</p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};

const BacklogHealthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  data: Array<{ id: number; nombre: string; activeBacklog: number; overdueTasks: number; overdueBacklogPct: number }>;
}> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <TrendingUp size={28} strokeWidth={3} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Salud del Backlog</h4>
              <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Desglose por Disciplina</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-10 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr>
                  <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Disciplina</th>
                  <th className="px-6 py-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] text-center bg-blue-50/50 rounded-l-xl">Activo</th>
                  <th className="px-6 py-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] text-center bg-blue-50/50">Vencidas</th>
                  <th className="px-6 py-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] text-center bg-blue-50/50 rounded-r-xl">% Vencido</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{row.nombre}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-xl font-black text-slate-800">{row.activeBacklog}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`text-xl font-black ${row.overdueTasks > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{row.overdueTasks}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xl font-black ${row.overdueBacklogPct > 0 ? 'text-amber-600' : 'text-blue-600'}`}>{row.overdueBacklogPct}%</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${row.overdueBacklogPct}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4">
            <AlertTriangle size={24} className="text-slate-400 shrink-0" />
            <p className="text-xs text-blue-600 font-bold leading-relaxed">
              Mismas metricas consolidadas de la tarjeta, calculadas con el backlog activo de cada disciplina.
            </p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};

const DisciplineProjectsModal: React.FC<{
  discipline: DisciplineStatusSummary | null;
  onClose: () => void;
}> = ({ discipline, onClose }) => {
  if (!discipline) return null;

  const sections: Array<{ key: 'DECK' | 'FROZEN' | 'WIP'; label: string; accent: string; bg: string }> = [
    { key: 'DECK', label: 'DECK', accent: 'text-slate-500', bg: 'bg-slate-100' },
    { key: 'FROZEN', label: 'FROZEN', accent: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'WIP', label: 'WIP', accent: 'text-blue-600', bg: 'bg-blue-50' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Layers size={28} strokeWidth={3} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{discipline.name}</h4>
              <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Proyectos por estado operativo</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {sections.map((section) => (
            <div key={section.key} className="rounded-[2rem] border border-slate-200 overflow-hidden bg-white">
              <div className={`px-5 py-4 border-b border-slate-100 ${section.bg} flex items-center justify-between`}>
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${section.accent}`}>{section.label}</span>
                <span className="text-[10px] font-black text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {discipline.details[section.key].length} proyectos
                </span>
              </div>
              <div className="p-4 space-y-3 max-h-[48vh] overflow-y-auto custom-scrollbar">
                {discipline.details[section.key].length > 0 ? (
                  discipline.details[section.key].map((project) => (
                    <div key={`${section.key}-${project.ot}`} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                      <p className="text-sm font-black text-slate-800">{project.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{project.ot}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{project.taskCount} tareas</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold uppercase tracking-widest text-slate-300">
                    Sin proyectos en este estado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
