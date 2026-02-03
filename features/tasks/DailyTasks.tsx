
import React, { useState, useMemo } from 'react';
import { Plus, CheckSquare, Send, CheckCircle2, Calendar, Layers, PauseCircle, PlayCircle, Filter, Users, X, Briefcase, Hash, UserCheck } from 'lucide-react';
import { Tarea, Actividad, Proyecto, User, ProjectStatus } from '../../types/index';
import { INITIAL_DISCIPLINAS, getStatusColor, getStatusIcon, formatDate } from '../../lib/utils';

interface DailyTasksProps {
  tareas: Tarea[];
  actividades: Actividad[];
  proyectos: Proyecto[];
  users: User[];
  onAddTask: (task: Omit<Tarea, 'id' | 'Estado' | 'fecha_creacion'>) => void;
  onUpdateTaskStatus: (id: number, status: ProjectStatus) => void;
  onUpdateTaskDates: (id: number, updates: Partial<Tarea>) => void;
  onAddActivity: (taskId: string, title: string) => void;
  onToggleActivity: (activityId: number, field: 'IsStarted' | 'IsCompleted') => void;
}

export const DailyTasks: React.FC<DailyTasksProps> = ({ 
  tareas, actividades, proyectos, users, 
  onAddTask, onUpdateTaskStatus, onUpdateTaskDates, onAddActivity, onToggleActivity 
}) => {
  const [newActivityInput, setNewActivityInput] = useState<{ [key: string]: string }>({});
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  const [filterDisciplina, setFilterDisciplina] = useState<string>('all');
  const [filterGerente, setFilterGerente] = useState<string>('all');

  const [newTaskForm, setNewTaskForm] = useState({
    Title: '',
    OT: proyectos[0]?.OT || '',
    ID_Unico_Tarea: '',
    ID_Disciplina: 1,
    ID_Ejecutor: users.find(u => u.rol === 'ejecutor')?.id || users[0].id,
    GerenteTarea: users.find(u => u.rol === 'gerente_tarea')?.id || users[0].id,
    FPlaneadaInicioOrig: '',
    FPlaneadaFinOrig: '',
    FEsperadaIni: '',
    FEsperadaFin: '',
  });

  const gerentesDisponibles = useMemo(() => 
    users.filter(u => u.rol === 'gerente_tarea'),
    [users]
  );

  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      const matchDisciplina = filterDisciplina === 'all' || t.ID_Disciplina === Number(filterDisciplina);
      const matchGerente = filterGerente === 'all' || t.GerenteTarea === Number(filterGerente);
      return matchDisciplina && matchGerente;
    });
  }, [tareas, filterDisciplina, filterGerente]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTask({
      ...newTaskForm,
      FPlaneadaInicioAct: newTaskForm.FPlaneadaInicioOrig,
      FPlaneadaFinAct: newTaskForm.FPlaneadaFinOrig,
    });
    setNewTaskForm({
      ...newTaskForm,
      Title: '',
      ID_Unico_Tarea: '',
      FPlaneadaInicioOrig: '',
      FPlaneadaFinOrig: '',
      FEsperadaIni: '',
      FEsperadaFin: '',
    });
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Seguimiento Diario</h2>
          <p className="text-sm text-slate-500 font-medium">Gestión operativa basada en estructura SharePoint</p>
        </div>
        <button 
          onClick={() => setIsAddingTask(true)} 
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> NUEVA TAREA
        </button>
      </header>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <select value={filterDisciplina} onChange={(e) => setFilterDisciplina(e.target.value)} className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 outline-none">
            <option value="all">Todas las Disciplinas</option>
            {INITIAL_DISCIPLINAS.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <select value={filterGerente} onChange={(e) => setFilterGerente(e.target.value)} className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 outline-none">
            <option value="all">Todos los Gerentes</option>
            {gerentesDisponibles.map(g => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto px-5 py-2.5 bg-slate-100 rounded-2xl border border-slate-200">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total: {tareasFiltradas.length}</span>
        </div>
      </div>

      {isAddingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddingTask(false)} />
          <form onSubmit={handleCreateTask} className="relative bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h4 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2"><Plus className="text-blue-600" /> Nueva Tarea (SharePoint Sync)</h4>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400">ID Único Tarea</label>
                  <input type="text" className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" required value={newTaskForm.ID_Unico_Tarea} onChange={e => setNewTaskForm({...newTaskForm, ID_Unico_Tarea: e.target.value})} placeholder="Ej: OT1001-Hito1" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400">OT Proyecto</label>
                  <select className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" required value={newTaskForm.OT} onChange={e => setNewTaskForm({...newTaskForm, OT: e.target.value})}>
                    {proyectos.map(p => (<option key={p.OT} value={p.OT}>{p.OT} - {p.Title}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400">Nombre del Entregable</label>
                <input type="text" className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" required value={newTaskForm.Title} onChange={e => setNewTaskForm({...newTaskForm, Title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400">Fecha Inicio Ori.</label>
                  <input type="date" className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" required value={newTaskForm.FPlaneadaInicioOrig} onChange={e => setNewTaskForm({...newTaskForm, FPlaneadaInicioOrig: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400">Fecha Fin Ori.</label>
                  <input type="date" className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" required value={newTaskForm.FPlaneadaFinOrig} onChange={e => setNewTaskForm({...newTaskForm, FPlaneadaFinOrig: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400">Fecha Esperada Ini.</label>
                  <input type="date" className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" value={newTaskForm.FEsperadaIni} onChange={e => setNewTaskForm({...newTaskForm, FEsperadaIni: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400">Fecha Esperada Fin</label>
                  <input type="date" className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-semibold" value={newTaskForm.FEsperadaFin} onChange={e => setNewTaskForm({...newTaskForm, FEsperadaFin: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsAddingTask(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase">Cancelar</button>
                 <button type="submit" className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-100">Crear Tarea</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {tareasFiltradas.map(tarea => {
          const taskActivities = actividades.filter(a => a.ID_Unico_Tarea === tarea.ID_Unico_Tarea);
          const progress = taskActivities.length > 0 ? Math.round((taskActivities.filter(a => a.IsCompleted).length / taskActivities.length) * 100) : 0;
          const project = proyectos.find(p => p.OT === tarea.OT);
          const isFinished = tarea.Estado === 'FINALIZADA';

          return (
            <div key={tarea.ID_Unico_Tarea} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group/card">
              <div className="p-4 bg-white border-b border-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-100">
                    {(['DECK', 'FROZEN', 'WIP'] as ProjectStatus[]).map((st) => (
                      <button key={st} onClick={() => onUpdateTaskStatus(tarea.id, st)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${tarea.Estado === st ? getStatusColor(st) : 'text-slate-400 hover:bg-slate-200/50'}`}>
                        {st}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0 ml-1">
                    <h3 className="font-black text-slate-800 text-sm md:text-base truncate">
                      <span className="text-slate-400 font-bold mr-1">[{tarea.OT}]</span> - {tarea.Title}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 truncate">
                      {project?.Title || 'PROYECTO DESCONOCIDO'} • {INITIAL_DISCIPLINAS.find(d => d.id === tarea.ID_Disciplina)?.nombre}
                    </p>
                  </div>
                </div>
                <button onClick={() => onUpdateTaskStatus(tarea.id, isFinished ? 'WIP' : 'FINALIZADA')} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${isFinished ? 'bg-green-600 text-white' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>
                  {isFinished ? 'FINALIZADA' : 'FINALIZAR'}
                </button>
              </div>

              <div className="flex flex-col md:grid md:grid-cols-12 divide-x divide-slate-100">
                <div className="p-8 md:col-span-5 bg-white space-y-8">
                  <div className="grid grid-cols-2 gap-x-10 gap-y-10">
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Plan Original</span>
                      <div className="text-[11px] text-slate-500 font-bold space-y-2 bg-slate-50/50 p-4 rounded-3xl">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="text-slate-800">{formatDate(tarea.FPlaneadaInicioOrig)}</span></div>
                        <div className="flex justify-between"><span>Fin:</span> <span className="text-slate-800">{formatDate(tarea.FPlaneadaFinOrig)}</span></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Plan Actualizado</span>
                      <div className="space-y-3">
                        <input type="date" className="text-[11px] font-black border-2 border-slate-50 rounded-2xl w-full px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={tarea.FPlaneadaInicioAct} onChange={e => onUpdateTaskDates(tarea.id, { FPlaneadaInicioAct: e.target.value })} />
                        <input type="date" className="text-[11px] font-black border-2 border-slate-50 rounded-2xl w-full px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={tarea.FPlaneadaFinAct} onChange={e => onUpdateTaskDates(tarea.id, { FPlaneadaFinAct: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Proyección Esperada</span>
                      <div className="space-y-3 bg-indigo-50/30 p-4 rounded-3xl">
                        <input type="date" className="text-[11px] font-black bg-white border-2 border-slate-100 rounded-2xl w-full px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-200 transition-all text-black" value={tarea.FEsperadaIni || ''} onChange={e => onUpdateTaskDates(tarea.id, { FEsperadaIni: e.target.value })} />
                        <input type="date" className="text-[11px] font-black bg-white border-2 border-slate-100 rounded-2xl w-full px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-200 transition-all text-black" value={tarea.FEsperadaFin || ''} onChange={e => onUpdateTaskDates(tarea.id, { FEsperadaFin: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Datos Reales</span>
                      <div className="text-[10px] text-slate-800 font-black space-y-2 bg-emerald-50/20 p-4 rounded-3xl border border-emerald-100/50">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="text-emerald-700">{formatDate(tarea.FRealInicio) || 'Pendiente'}</span></div>
                        <div className="flex justify-between"><span>Cierre:</span> <span className="text-emerald-700">{formatDate(tarea.FRealFin) || 'Pendiente'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:col-span-7 bg-slate-50/50">
                  <div className="flex justify-between mb-8 items-center">
                    <h4 className="font-black text-xs text-slate-800 uppercase tracking-[0.2em]">ACTIVIDADES ({taskActivities.length})</h4>
                    <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">{progress}%</span>
                  </div>
                  <div className="flex gap-4 mb-8">
                    <input type="text" placeholder="Nueva actividad..." className="flex-1 px-6 py-4.5 border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold" value={newActivityInput[tarea.ID_Unico_Tarea] || ''} onChange={(e) => setNewActivityInput({ ...newActivityInput, [tarea.ID_Unico_Tarea]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && (onAddActivity(tarea.ID_Unico_Tarea, newActivityInput[tarea.ID_Unico_Tarea]), setNewActivityInput({...newActivityInput, [tarea.ID_Unico_Tarea]:''}))} />
                    <button onClick={() => (onAddActivity(tarea.ID_Unico_Tarea, newActivityInput[tarea.ID_Unico_Tarea]), setNewActivityInput({...newActivityInput, [tarea.ID_Unico_Tarea]:''}))} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 active:scale-90 transition-transform"><Plus /></button>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                    {taskActivities.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.75rem] hover:border-blue-200 transition-colors">
                        <span className={`text-sm font-black truncate pr-4 ${a.IsCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{a.Title}</span>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { if (a.IsStarted && a.IsCompleted) { onToggleActivity(a.id, 'IsStarted'); onToggleActivity(a.id, 'IsCompleted'); } else { onToggleActivity(a.id, 'IsStarted'); } }} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${a.IsStarted ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-300 border-slate-50'}`}>INICIADA</button>
                          <button onClick={() => { if (!a.IsStarted && !a.IsCompleted) { window.alert("Debe iniciar la actividad antes de finalizarla"); return; } onToggleActivity(a.id, 'IsCompleted'); }} disabled={!a.IsStarted && !a.IsCompleted} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${a.IsCompleted ? 'bg-green-100 text-green-700 border-green-200' : `bg-white text-slate-300 border-slate-50 ${!a.IsStarted ? 'opacity-30 cursor-not-allowed' : ''}`}`}>FINALIZADA</button>
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
