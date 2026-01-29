
import React, { useState, useMemo } from 'react';
import { Plus, CheckSquare, Send, CheckCircle2, Calendar, Layers, PlayCircle, Filter, Users, X, Briefcase, Hash, UserCheck } from 'lucide-react';
import { Tarea, Actividad, Proyecto, User, ProjectStatus } from '../../types/index';
import { INITIAL_DISCIPLINAS, getStatusColor, getStatusIcon, formatDate } from '../../lib/utils';

interface DailyTasksProps {
  tareas: Tarea[];
  actividades: Actividad[];
  proyectos: Proyecto[];
  users: User[];
  onAddTask: (task: any) => void;
  onUpdateTaskStatus: (id: number, status: ProjectStatus) => void;
  onUpdateTaskDates: (id: number, updates: Partial<Tarea>) => void;
  onAddActivity: (taskId: number, nombre: string) => void;
  onToggleActivity: (activityId: number, field: 'IsStarted' | 'IsCompleted') => void;
}

export const DailyTasks: React.FC<DailyTasksProps> = ({ 
  tareas, actividades, proyectos, users, 
  onAddTask, onUpdateTaskStatus, onUpdateTaskDates, onAddActivity, onToggleActivity 
}) => {
  const [newActivityInput, setNewActivityInput] = useState<{ [key: number]: string }>({});
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [filterDisciplina, setFilterDisciplina] = useState<string>('all');
  const [filterGerente, setFilterGerente] = useState<string>('all');

  const [newTaskForm, setNewTaskForm] = useState({
    nombre: '',
    id_proyecto: proyectos[0]?.id || 1,
    ID_Disciplina: "1",
    ID_Ejecutor: users.find(u => u.rol === 'ejecutor')?.id?.toString() || "1",
    id_gerente_tarea: users.find(u => u.rol === 'gerente_tarea')?.id || 1,
    FPlaneadaInicioOrig: '',
    FPlaneadaFinOrig: '',
    OT: ''
  });

  const gerentesDisponibles = useMemo(() => users.filter(u => u.rol === 'gerente_tarea'), [users]);

  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      const matchDisciplina = filterDisciplina === 'all' || t.ID_Disciplina === filterDisciplina;
      const matchGerente = filterGerente === 'all' || t.id_gerente_tarea === Number(filterGerente);
      return matchDisciplina && matchGerente;
    });
  }, [tareas, filterDisciplina, filterGerente]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const selProject = proyectos.find(p => p.id === newTaskForm.id_proyecto);
    onAddTask({
      ...newTaskForm,
      FPlaneadaInicioAct: newTaskForm.FPlaneadaInicioOrig,
      FPlaneadaFinAct: newTaskForm.FPlaneadaFinOrig,
      OT: selProject?.ot || ''
    });
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Seguimiento Diario</h2>
          <p className="text-sm text-slate-500 font-medium">Gestión operativa por disciplina</p>
        </div>
        <button onClick={() => setIsAddingTask(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl flex items-center gap-2">
          <Plus size={18} strokeWidth={3} /> NUEVA TAREA
        </button>
      </header>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2 text-slate-400"><Filter size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Filtros</span></div>
        <select value={filterDisciplina} onChange={(e) => setFilterDisciplina(e.target.value)} className="flex-1 min-w-[200px] p-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <option value="all">Todas las Disciplinas</option>
            {INITIAL_DISCIPLINAS.map(d => (<option key={d.id} value={d.id.toString()}>{d.nombre}</option>))}
        </select>
        <select value={filterGerente} onChange={(e) => setFilterGerente(e.target.value)} className="flex-1 min-w-[200px] p-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <option value="all">Todos los Gerentes</option>
            {gerentesDisponibles.map(g => (<option key={g.id} value={g.id.toString()}>{g.nombre}</option>))}
        </select>
      </div>

      {isAddingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddingTask(false)} />
          <form onSubmit={handleCreateTask} className="relative bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h4 className="font-black text-xl text-slate-800 mb-6">Nueva Tarea Operativa</h4>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Proyecto</label>
                  <select className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" value={newTaskForm.id_proyecto} onChange={e => setNewTaskForm({...newTaskForm, id_proyecto: Number(e.target.value)})}>
                    {proyectos.map(p => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Disciplina</label>
                  <select className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" value={newTaskForm.ID_Disciplina} onChange={e => setNewTaskForm({...newTaskForm, ID_Disciplina: e.target.value})}>
                    {INITIAL_DISCIPLINAS.map(d => (<option key={d.id} value={d.id.toString()}>{d.nombre}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nombre del Entregable</label>
                <input type="text" className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" placeholder="Ej: Diseño de Arquitectura" required value={newTaskForm.nombre} onChange={e => setNewTaskForm({...newTaskForm, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <input type="date" className="p-4 border border-slate-200 rounded-2xl text-sm font-semibold" required value={newTaskForm.FPlaneadaInicioOrig} onChange={e => setNewTaskForm({...newTaskForm, FPlaneadaInicioOrig: e.target.value})} />
                <input type="date" className="p-4 border border-slate-200 rounded-2xl text-sm font-semibold" required value={newTaskForm.FPlaneadaFinOrig} onChange={e => setNewTaskForm({...newTaskForm, FPlaneadaFinOrig: e.target.value})} />
              </div>
              <div className="flex gap-3">
                 <button type="button" onClick={() => setIsAddingTask(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cancelar</button>
                 <button type="submit" className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Crear Tarea</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {tareasFiltradas.map(tarea => {
          const taskActivities = actividades.filter(a => a.ID_Tarea === tarea.id);
          const progress = taskActivities.length > 0 ? Math.round((taskActivities.filter(a => a.IsCompleted).length / taskActivities.length) * 100) : 0;
          const isFinished = tarea.estado === 'FINALIZADA';

          return (
            <div key={tarea.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all group/card">
              <div className="p-4 bg-white border-b border-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
                    {(['DECK', 'FROZEN', 'WIP'] as ProjectStatus[]).map((st) => (
                      <button key={st} onClick={() => onUpdateTaskStatus(tarea.id, st)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${tarea.estado === st ? getStatusColor(st) + ' shadow-md' : 'text-slate-400 hover:bg-slate-200/50'}`}>
                        {st}
                      </button>
                    ))}
                  </div>
                  <div className="hidden sm:block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px] border border-slate-200 whitespace-nowrap">OT: {tarea.OT}</div>
                  <h3 className="font-black text-slate-800 text-base leading-tight group-hover/card:text-blue-600 transition-colors">{tarea.nombre}</h3>
                </div>
                <button onClick={() => onUpdateTaskStatus(tarea.id, isFinished ? 'WIP' : 'FINALIZADA')} className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${isFinished ? 'bg-green-600 text-white shadow-xl' : 'bg-white text-slate-400 border-2 border-slate-100 hover:text-green-600'}`}>
                  <CheckCircle2 size={14} /> FINALIZADA
                </button>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-100">
                <div className="p-8 col-span-5 bg-white space-y-8">
                  <div className="grid grid-cols-2 gap-x-10 gap-y-10">
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-slate-300 uppercase block tracking-widest">Planeamiento</span>
                      <div className="text-[11px] text-slate-500 font-bold space-y-2 bg-slate-50/50 p-4 rounded-3xl border border-slate-50">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="text-slate-800">{formatDate(tarea.FPlaneadaInicioAct)}</span></div>
                        <div className="flex justify-between"><span>Fin:</span> <span className="text-slate-800">{formatDate(tarea.FPlaneadaFinAct)}</span></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-blue-400 uppercase block tracking-widest">Logs Real</span>
                      <div className="text-[10px] text-slate-800 font-black space-y-3 bg-emerald-50/20 p-4 rounded-3xl border border-emerald-100/50">
                        <div className="flex justify-between items-center"><span className="text-slate-400 uppercase text-[8px]">Inicio</span><span className={tarea.FRealInicio ? 'text-emerald-700' : 'text-slate-300'}>{formatDate(tarea.FRealInicio)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400 uppercase text-[8px]">Cierre</span><span className={tarea.FRealFin ? 'text-emerald-700' : 'text-slate-300'}>{formatDate(tarea.FRealFin)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 col-span-7 bg-slate-50/50 flex flex-col">
                  <div className="flex justify-between mb-8 items-center">
                    <h4 className="font-black text-xs text-slate-800 uppercase tracking-[0.2em]">ACTIVIDADES ({taskActivities.length})</h4>
                    <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">{progress}%</span>
                  </div>
                  <div className="flex gap-4 mb-8">
                    <input type="text" placeholder="Nueva actividad operativa..." className="flex-1 px-6 py-4.5 border-2 border-slate-100 rounded-[1.5rem] text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-100 font-bold" value={newActivityInput[tarea.id] || ''} onChange={(e) => setNewActivityInput({ ...newActivityInput, [tarea.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && (onAddActivity(tarea.id, newActivityInput[tarea.id]), setNewActivityInput({...newActivityInput, [tarea.id]:''}))} />
                    <button onClick={() => (onAddActivity(tarea.id, newActivityInput[tarea.id]), setNewActivityInput({...newActivityInput, [tarea.id]:''}))} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl"><Plus size={28} /></button>
                  </div>
                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                    {taskActivities.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.75rem] hover:shadow-xl transition-all">
                        <span className={`text-sm font-black truncate ${a.IsCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{a.nombre}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <button onClick={() => onToggleActivity(a.id, 'IsStarted')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border-2 ${a.IsStarted ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-300 border-slate-50'}`}><PlayCircle size={12} /> INICIADA</button>
                          <button disabled={!a.IsStarted} onClick={() => onToggleActivity(a.id, 'IsCompleted')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border-2 ${a.IsCompleted ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-300 border-slate-50'} ${!a.IsStarted ? 'opacity-30' : ''}`}><CheckCircle2 size={12} /> FINALIZADA</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
