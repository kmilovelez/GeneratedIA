
import React, { useState, useMemo } from 'react';
import { Plus, CheckSquare, Send, CheckCircle2, Calendar, Layers, PauseCircle, PlayCircle, Filter, Users, X, Briefcase, Hash, UserCheck } from 'lucide-react';
import { Tarea, Actividad, Proyecto, User, ProjectStatus } from '../../types/index';
import { INITIAL_DISCIPLINAS, getStatusColor, getStatusIcon, formatDate } from '../../lib/utils';

interface DailyTasksProps {
  tareas: Tarea[];
  actividades: Actividad[];
  proyectos: Proyecto[];
  users: User[];
  onAddTask: (task: Omit<Tarea, 'id' | 'estado' | 'fecha_creacion'>) => void;
  onUpdateTaskStatus: (id: number, status: ProjectStatus) => void;
  onUpdateTaskDates: (id: number, updates: Partial<Tarea>) => void;
  onAddActivity: (taskId: number, nombre: string) => void;
  onToggleActivity: (activityId: number, field: 'isStarted' | 'isCompleted') => void;
}

export const DailyTasks: React.FC<DailyTasksProps> = ({ 
  tareas, actividades, proyectos, users, 
  onAddTask, onUpdateTaskStatus, onUpdateTaskDates, onAddActivity, onToggleActivity 
}) => {
  const [newActivityInput, setNewActivityInput] = useState<{ [key: number]: string }>({});
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  // Estados para filtros
  const [filterDisciplina, setFilterDisciplina] = useState<string>('all');
  const [filterGerente, setFilterGerente] = useState<string>('all');

  const [newTaskForm, setNewTaskForm] = useState({
    nombre: '',
    id_proyecto: proyectos[0]?.id || 1,
    id_disciplina: 1,
    id_ejecutor: users.find(u => u.rol === 'ejecutor')?.id || users[0].id,
    id_gerente_tarea: users.find(u => u.rol === 'gerente_tarea')?.id || users[0].id,
    fecha_planeada_inicio_original: '',
    fecha_planeada_fin_original: '',
  });

  // Filtrado de gerentes de tarea para el dropdown de filtros
  const gerentesDisponibles = useMemo(() => 
    users.filter(u => u.rol === 'gerente_tarea'),
    [users]
  );

  // Lógica de filtrado de tareas
  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      const matchDisciplina = filterDisciplina === 'all' || t.id_disciplina === Number(filterDisciplina);
      const matchGerente = filterGerente === 'all' || t.id_gerente_tarea === Number(filterGerente);
      return matchDisciplina && matchGerente;
    });
  }, [tareas, filterDisciplina, filterGerente]);

  const resetFilters = () => {
    setFilterDisciplina('all');
    setFilterGerente('all');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTask({
      ...newTaskForm,
      fecha_planeada_inicio_actualizada: newTaskForm.fecha_planeada_inicio_original,
      fecha_planeada_fin_actualizada: newTaskForm.fecha_planeada_fin_original,
    });
    setNewTaskForm({
      ...newTaskForm,
      nombre: '',
      fecha_planeada_inicio_original: '',
      fecha_planeada_fin_original: '',
    });
    setIsAddingTask(false);
  };

  const selectedProjectForNewTask = proyectos.find(p => p.id === newTaskForm.id_proyecto);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Seguimiento Diario</h2>
          <p className="text-sm text-slate-500 font-medium">Gestión operativa y control de hitos por disciplina</p>
        </div>
        <button 
          onClick={() => setIsAddingTask(true)} 
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> NUEVA TAREA
        </button>
      </header>

      {/* Barra de Herramientas de Filtrado */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-5 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
        </div>

        {/* Selector de Disciplina */}
        <div className="relative flex-1 min-w-[220px]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Layers size={14} />
          </div>
          <select 
            value={filterDisciplina}
            onChange={(e) => setFilterDisciplina(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="all">Todas las Disciplinas</option>
            {INITIAL_DISCIPLINAS.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Selector de Gerente de Tarea */}
        <div className="relative flex-1 min-w-[220px]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Users size={14} />
          </div>
          <select 
            value={filterGerente}
            onChange={(e) => setFilterGerente(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="all">Todos los Gerentes</option>
            {gerentesDisponibles.map(g => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </div>

        {/* Botón de Limpiar */}
        {(filterDisciplina !== 'all' || filterGerente !== 'all') && (
          <button 
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
          >
            <X size={14} strokeWidth={3} /> Limpiar
          </button>
        )}

        <div className="ml-auto px-5 py-2.5 bg-slate-100 rounded-2xl border border-slate-200">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resultados: {tareasFiltradas.length}</span>
        </div>
      </div>

      {isAddingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddingTask(false)} />
          <form onSubmit={handleCreateTask} className="relative bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Plus size={24} strokeWidth={3} />
               </div>
               <div>
                  <h4 className="font-black text-xl text-slate-800 leading-tight">Nueva Tarea Operativa</h4>
                  <p className="text-xs text-slate-400 font-medium">Asigna un nuevo entregable a una OT</p>
               </div>
            </div>

            <div className="space-y-6">
              {/* Selector de Proyecto con OT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                    <Briefcase size={12} /> Proyecto de Referencia
                  </label>
                  <select 
                    className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold shadow-sm appearance-none cursor-pointer" 
                    required 
                    value={newTaskForm.id_proyecto} 
                    onChange={e => setNewTaskForm({...newTaskForm, id_proyecto: Number(e.target.value)})}
                  >
                    {proyectos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                    <Hash size={12} /> Orden de Trabajo (OT)
                  </label>
                  <div className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-between shadow-sm">
                    {selectedProjectForNewTask?.ot || '---'}
                    <span className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg text-slate-400">LECTURA</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre del Entregable</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold placeholder:text-slate-300 shadow-sm" 
                  placeholder="Ej: Implementación Módulo de Usuarios" 
                  required 
                  value={newTaskForm.nombre} 
                  onChange={e => setNewTaskForm({...newTaskForm, nombre: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                    <Layers size={12} /> Disciplina
                  </label>
                  <select 
                    className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold shadow-sm appearance-none" 
                    value={newTaskForm.id_disciplina}
                    onChange={e => setNewTaskForm({...newTaskForm, id_disciplina: Number(e.target.value)})}
                  >
                    {INITIAL_DISCIPLINAS.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                    <UserCheck size={12} /> Gerente de Tarea
                  </label>
                  <select 
                    className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold shadow-sm appearance-none" 
                    value={newTaskForm.id_gerente_tarea}
                    onChange={e => setNewTaskForm({...newTaskForm, id_gerente_tarea: Number(e.target.value)})}
                  >
                    {gerentesDisponibles.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha Inicio</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    <input 
                      type="date" 
                      className="w-full pl-12 pr-4 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-50 font-semibold shadow-sm transition-all" 
                      required 
                      value={newTaskForm.fecha_planeada_inicio_original} 
                      onChange={e => setNewTaskForm({...newTaskForm, fecha_planeada_inicio_original: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha Fin</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    <input 
                      type="date" 
                      className="w-full pl-12 pr-4 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-50 font-semibold shadow-sm transition-all" 
                      required 
                      value={newTaskForm.fecha_planeada_fin_original} 
                      onChange={e => setNewTaskForm({...newTaskForm, fecha_planeada_fin_original: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                 <button 
                   type="button"
                   onClick={() => setIsAddingTask(false)}
                   className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98]"
                 >
                    Cancelar
                 </button>
                 <button 
                   type="submit" 
                   className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                 >
                    Crear Tarea en DECK
                 </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {tareasFiltradas.length > 0 ? tareasFiltradas.map(tarea => {
          const taskActivities = actividades.filter(a => a.id_tarea === tarea.id);
          const progress = taskActivities.length > 0 ? Math.round((taskActivities.filter(a => a.isCompleted).length / taskActivities.length) * 100) : 0;
          const project = proyectos.find(p => p.id === tarea.id_proyecto);
          const isStarted = !!tarea.fecha_real_inicio;
          const isFinished = tarea.estado === 'FINALIZADA';

          return (
            <div key={tarea.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:shadow-slate-200/50 group/card">
              {/* Card Header: Selector de Estado + Títulos + OT Badge */}
              <div className="p-6 bg-white border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
                    {(['DECK', 'FROZEN', 'WIP'] as ProjectStatus[]).map((st) => {
                      const Icon = getStatusIcon(st);
                      const active = tarea.estado === st;
                      return (
                        <button
                          key={st}
                          onClick={() => {
                              onUpdateTaskStatus(tarea.id, st);
                              if (st === 'WIP' && !tarea.fecha_real_inicio) {
                                  onUpdateTaskDates(tarea.id, { fecha_real_inicio: new Date().toISOString() });
                              }
                          }}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                            active ? getStatusColor(st) + ' shadow-md scale-105' : 'text-slate-400 hover:bg-slate-200/50'
                          }`}
                        >
                          <Icon size={14} strokeWidth={3} />
                          {st}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center">
                    {isStarted && (
                        <div className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-50/50 text-blue-600 rounded-2xl border border-blue-100/50">
                            <PlayCircle size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase">INICIADA:</span>
                            <span className="text-[10px] font-bold">{new Date(tarea.fecha_real_inicio!).toLocaleDateString()}</span>
                        </div>
                    )}
                    
                    {project && (
                      <div className="ml-4 px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-bold text-xs shadow-sm border border-slate-200 whitespace-nowrap">
                        OT: {project.ot}
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block">
                    <div className="flex items-center gap-3">
                       <h3 className="font-black text-slate-800 text-lg leading-tight tracking-tight group-hover/card:text-blue-600 transition-colors">{tarea.nombre}</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                      {project?.nombre} • {INITIAL_DISCIPLINAS.find(d => d.id === tarea.id_disciplina)?.nombre}
                    </p>
                  </div>
                </div>

                <button
                    onClick={() => onUpdateTaskStatus(tarea.id, isFinished ? 'WIP' : 'FINALIZADA')}
                    className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-xs font-black uppercase transition-all tracking-widest ${
                        isFinished 
                        ? 'bg-green-600 text-white shadow-xl shadow-green-100 scale-105' 
                        : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-green-400 hover:text-green-600 hover:bg-green-50/30'
                    }`}
                >
                    <CheckCircle2 size={18} strokeWidth={3} />
                    FINALIZADA
                </button>
              </div>

              <div className="flex flex-col md:grid md:grid-cols-12 divide-x divide-slate-100 h-full">
                {/* Panel Izquierdo: Cronograma (Col 1-5) */}
                <div className="p-8 md:col-span-5 bg-white space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Calendar size={12} className="text-slate-300" strokeWidth={3} /> CRONOGRAMA DE HITOS
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-10 gap-y-10">
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-slate-300 uppercase block tracking-widest">Planteamiento Original</span>
                      <div className="text-[11px] text-slate-500 font-bold space-y-2 bg-slate-50/50 p-4 rounded-3xl border border-slate-50">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="text-slate-800">{formatDate(tarea.fecha_planeada_inicio_original)}</span></div>
                        <div className="flex justify-between"><span>Fin:</span> <span className="text-slate-800">{formatDate(tarea.fecha_planeada_fin_original)}</span></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-blue-400 uppercase block tracking-widest">Actualización</span>
                      <div className="space-y-3">
                        <input type="date" className="text-[11px] font-black border-2 border-slate-50 rounded-2xl w-full px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-50 bg-white text-slate-900 shadow-sm transition-all" value={tarea.fecha_planeada_inicio_actualizada} onChange={e => onUpdateTaskDates(tarea.id, { fecha_planeada_inicio_actualizada: e.target.value })} />
                        <input type="date" className="text-[11px] font-black border-2 border-slate-50 rounded-2xl w-full px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-50 bg-white text-slate-900 shadow-sm transition-all" value={tarea.fecha_planeada_fin_actualizada} onChange={e => onUpdateTaskDates(tarea.id, { fecha_planeada_fin_actualizada: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-indigo-400 uppercase block tracking-widest">Proyección Esperada</span>
                      <div className="space-y-3">
                        <input type="date" className="text-[11px] font-black border-2 border-slate-50 rounded-2xl w-full px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-50 bg-white text-slate-900 shadow-sm transition-all" value={tarea.fecha_esperada_inicio || ''} onChange={e => onUpdateTaskDates(tarea.id, { fecha_esperada_inicio: e.target.value })} />
                        <input type="date" className="text-[11px] font-black border-2 border-slate-50 rounded-2xl w-full px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-50 bg-white text-slate-900 shadow-sm transition-all" value={tarea.fecha_esperada_fin || ''} onChange={e => onUpdateTaskDates(tarea.id, { fecha_esperada_fin: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-emerald-500 uppercase block tracking-widest">Logs de Ejecución</span>
                      <div className="text-[10px] text-slate-800 font-black space-y-3 bg-emerald-50/20 p-4 rounded-3xl border border-emerald-100/50">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 uppercase text-[8px] tracking-tighter">Inicio Real</span>
                            <span className={tarea.fecha_real_inicio ? 'text-emerald-700 font-bold' : 'text-slate-300'}>{tarea.fecha_real_inicio ? new Date(tarea.fecha_real_inicio).toLocaleDateString() : 'Pendiente'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 uppercase text-[8px] tracking-tighter">Cierre Real</span>
                            <span className={tarea.fecha_real_fin ? 'text-emerald-700 font-bold' : 'text-slate-300'}>{tarea.fecha_real_fin ? new Date(tarea.fecha_real_fin).toLocaleDateString() : 'Pendiente'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Derecho: ACTIVIDADES (Col 6-12) */}
                <div className="p-8 md:col-span-7 bg-slate-50/50 flex flex-col h-full min-h-[450px]">
                  {/* Header Actividades con Barra de Progreso */}
                  <div className="flex justify-between mb-8 items-center">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-blue-600">
                        <CheckSquare size={18} strokeWidth={3} />
                      </div>
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-[0.2em]">
                        ACTIVIDADES OPERATIVAS ({taskActivities.length})
                      </h4>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="w-40 bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner p-[1px]">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">{progress}%</span>
                    </div>
                  </div>

                  {/* Input de nueva actividad */}
                  <div className="flex gap-4 mb-8">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="Nombre de la nueva actividad operativa..." 
                        className="w-full px-6 py-4.5 border-2 border-slate-100 rounded-[1.5rem] text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-100/50 transition-all bg-white font-bold text-slate-900 placeholder:text-slate-300" 
                        value={newActivityInput[tarea.id] || ''} 
                        onChange={(e) => setNewActivityInput({ ...newActivityInput, [tarea.id]: e.target.value })} 
                        onKeyDown={(e) => e.key === 'Enter' && (onAddActivity(tarea.id, newActivityInput[tarea.id]), setNewActivityInput({...newActivityInput, [tarea.id]:''}))} 
                      />
                    </div>
                    <button 
                      onClick={() => (onAddActivity(tarea.id, newActivityInput[tarea.id]), setNewActivityInput({...newActivityInput, [tarea.id]:''}))} 
                      className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-blue-700 hover:rotate-90 transition-all shadow-xl shadow-blue-200 active:scale-90"
                    >
                      <Plus size={28} strokeWidth={3} />
                    </button>
                  </div>

                  {/* Lista de actividades (Contenedor con scroll) */}
                  <div className="space-y-4 flex-1 overflow-y-auto pr-3 custom-scrollbar max-h-[550px]">
                    {taskActivities.length > 0 ? taskActivities.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.75rem] group/item hover:border-blue-200 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300">
                        <div className="flex-1 min-w-0 pr-6">
                          <span className={`text-sm block truncate font-black tracking-tight transition-all ${a.isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                            {a.nombre}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Botón Estado: INICIADA */}
                          <button
                            onClick={() => onToggleActivity(a.id, 'isStarted')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border-2 ${
                                a.isStarted 
                                ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-lg shadow-amber-50 scale-105' 
                                : 'bg-white text-slate-300 border-slate-50 hover:border-amber-100 hover:text-amber-500 hover:bg-amber-50/30'
                            }`}
                          >
                            <PlayCircle size={14} strokeWidth={3} className={a.isStarted ? 'animate-pulse' : ''} />
                            INICIADA
                          </button>

                          {/* Botón Estado: FINALIZADA */}
                          <button
                            onClick={() => onToggleActivity(a.id, 'isCompleted')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border-2 ${
                                a.isCompleted 
                                ? 'bg-green-100 text-green-700 border-green-200 shadow-lg shadow-green-50 scale-105' 
                                : 'bg-white text-slate-300 border-slate-50 hover:border-green-100 hover:text-green-600 hover:bg-green-50/30'
                            }`}
                          >
                            <CheckCircle2 size={14} strokeWidth={3} />
                            FINALIZADA
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-[3rem] gap-6 bg-white/50 backdrop-blur-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
                          <Send size={40} className="opacity-30" />
                        </div>
                        <div className="text-center">
                          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Sin Actividades</span>
                          <p className="text-[10px] text-slate-400 mt-2 font-bold">Inicia el flujo de trabajo añadiendo hitos</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-6">
             <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
                <Filter size={48} className="opacity-20" />
             </div>
             <div>
                <h4 className="font-black text-xl text-slate-800 tracking-tight">Sin coincidencias encontradas</h4>
                <p className="text-sm text-slate-400 font-medium">Prueba ajustando los parámetros de disciplina o gerente.</p>
             </div>
             <button 
               onClick={resetFilters}
               className="mt-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
             >
               Restablecer Filtros
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
