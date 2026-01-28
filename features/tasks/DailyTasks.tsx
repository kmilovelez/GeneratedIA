
import React, { useState, useMemo } from 'react';
import { Plus, CheckSquare, Send, CheckCircle2, Calendar, Layers, PauseCircle, PlayCircle, Filter, Users, X } from 'lucide-react';
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
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Seguimiento Diario</h2>
          <p className="text-sm text-slate-500 font-medium">Gestión operativa y control de hitos</p>
        </div>
        <button 
          onClick={() => setIsAddingTask(true)} 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2"
        >
          <Plus size={18} /> NUEVA TAREA
        </button>
      </header>

      {/* Barra de Herramientas de Filtrado */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
        </div>

        {/* Selector de Disciplina */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Layers size={14} />
          </div>
          <select 
            value={filterDisciplina}
            onChange={(e) => setFilterDisciplina(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none"
          >
            <option value="all">Todas las Disciplinas</option>
            {INITIAL_DISCIPLINAS.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Selector de Gerente de Tarea */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Users size={14} />
          </div>
          <select 
            value={filterGerente}
            onChange={(e) => setFilterGerente(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none"
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
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
          >
            <X size={14} /> Limpiar
          </button>
        )}

        <div className="ml-auto px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Resultados: {tareasFiltradas.length}</span>
        </div>
      </div>

      {isAddingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddingTask(false)} />
          <form onSubmit={handleCreateTask} className="relative bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <h4 className="font-bold text-xl mb-6 text-slate-800">Nueva Tarea Operativa</h4>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Nombre del Entregable</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm" 
                  placeholder="Ej: Implementación Módulo de Usuarios" 
                  required 
                  value={newTaskForm.nombre} 
                  onChange={e => setNewTaskForm({...newTaskForm, nombre: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Fecha Inicio</label>
                  <input type="date" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" required value={newTaskForm.fecha_planeada_inicio_original} onChange={e => setNewTaskForm({...newTaskForm, fecha_planeada_inicio_original: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Fecha Fin</label>
                  <input type="date" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" required value={newTaskForm.fecha_planeada_fin_original} onChange={e => setNewTaskForm({...newTaskForm, fecha_planeada_fin_original: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]">
                Crear Tarea en DECK
              </button>
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
            <div key={tarea.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition hover:shadow-xl hover:shadow-slate-200/50">
              {/* Card Header: Selector de Estado + Títulos */}
              <div className="p-5 bg-white border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
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
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                            active ? getStatusColor(st) + ' shadow-md' : 'text-slate-400 hover:bg-slate-200/50'
                          }`}
                        >
                          <Icon size={14} />
                          {st}
                        </button>
                      );
                    })}
                  </div>
                  
                  {isStarted && (
                      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50/50 text-blue-600 rounded-2xl border border-blue-100/50">
                          <PlayCircle size={14} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase">INICIADA:</span>
                          <span className="text-[10px] font-bold">{new Date(tarea.fecha_real_inicio!).toLocaleDateString()}</span>
                      </div>
                  )}

                  <div className="hidden lg:block">
                    <h3 className="font-extrabold text-slate-800 text-base leading-tight">{tarea.nombre}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {project?.nombre} • {INITIAL_DISCIPLINAS.find(d => d.id === tarea.id_disciplina)?.nombre}
                    </p>
                  </div>
                </div>

                <button
                    onClick={() => onUpdateTaskStatus(tarea.id, isFinished ? 'WIP' : 'FINALIZADA')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${
                        isFinished 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-100 scale-105' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-green-400 hover:text-green-600 hover:bg-green-50/30'
                    }`}
                >
                    <CheckCircle2 size={16} />
                    FINALIZADA
                </button>
              </div>

              <div className="flex flex-col md:grid md:grid-cols-12 divide-x divide-slate-100 h-full">
                {/* Panel Izquierdo: Cronograma (Col 1-5) */}
                <div className="p-8 md:col-span-5 bg-white space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Calendar size={12} className="text-slate-300" /> CRONOGRAMA DE HITOS
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-300 uppercase block">Planteamiento Original</span>
                      <div className="text-[11px] text-slate-500 font-semibold space-y-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="text-slate-800">{formatDate(tarea.fecha_planeada_inicio_original)}</span></div>
                        <div className="flex justify-between"><span>Fin:</span> <span className="text-slate-800">{formatDate(tarea.fecha_planeada_fin_original)}</span></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-blue-400 uppercase block">Actualización de Fechas</span>
                      <div className="space-y-2">
                        <input type="date" className="text-[11px] font-bold border border-slate-100 rounded-xl w-full px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 bg-slate-50/30" value={tarea.fecha_planeada_inicio_actualizada} onChange={e => onUpdateTaskDates(tarea.id, { fecha_planeada_inicio_actualizada: e.target.value })} />
                        <input type="date" className="text-[11px] font-bold border border-slate-100 rounded-xl w-full px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 bg-slate-50/30" value={tarea.fecha_planeada_fin_actualizada} onChange={e => onUpdateTaskDates(tarea.id, { fecha_planeada_fin_actualizada: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-indigo-400 uppercase block">Proyección Esperada</span>
                      <div className="space-y-2">
                        <input type="date" className="text-[11px] font-bold border border-slate-100 rounded-xl w-full px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 bg-slate-50/30" value={tarea.fecha_esperada_inicio || ''} onChange={e => onUpdateTaskDates(tarea.id, { fecha_esperada_inicio: e.target.value })} />
                        <input type="date" className="text-[11px] font-bold border border-slate-100 rounded-xl w-full px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 bg-slate-50/30" value={tarea.fecha_esperada_fin || ''} onChange={e => onUpdateTaskDates(tarea.id, { fecha_esperada_fin: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-emerald-500 uppercase block">Ejecución Real (Logs)</span>
                      <div className="text-[10px] text-slate-800 font-bold space-y-2 bg-emerald-50/20 p-3 rounded-2xl border border-emerald-100/50">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 uppercase text-[8px]">Inicio</span>
                            <span className={tarea.fecha_real_inicio ? 'text-emerald-700' : 'text-slate-300'}>{tarea.fecha_real_inicio ? new Date(tarea.fecha_real_inicio).toLocaleDateString() : 'Pendiente'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 uppercase text-[8px]">Cierre</span>
                            <span className={tarea.fecha_real_fin ? 'text-emerald-700' : 'text-slate-300'}>{tarea.fecha_real_fin ? new Date(tarea.fecha_real_fin).toLocaleDateString() : 'Pendiente'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Derecho: ACTIVIDADES (Col 6-12) */}
                <div className="p-8 md:col-span-7 bg-slate-50/40 flex flex-col h-full min-h-[400px]">
                  {/* Header Actividades con Barra de Progreso */}
                  <div className="flex justify-between mb-6 items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-blue-600">
                        <CheckSquare size={16} />
                      </div>
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest">
                        ACTIVIDADES ({taskActivities.length})
                      </h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-blue-600 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{progress}%</span>
                    </div>
                  </div>

                  {/* Input de nueva actividad */}
                  <div className="flex gap-3 mb-8">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="Nombre de la nueva actividad..." 
                        className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-100/50 transition-all bg-white font-medium" 
                        value={newActivityInput[tarea.id] || ''} 
                        onChange={(e) => setNewActivityInput({ ...newActivityInput, [tarea.id]: e.target.value })} 
                        onKeyDown={(e) => e.key === 'Enter' && (onAddActivity(tarea.id, newActivityInput[tarea.id]), setNewActivityInput({...newActivityInput, [tarea.id]:''}))} 
                      />
                    </div>
                    <button 
                      onClick={() => (onAddActivity(tarea.id, newActivityInput[tarea.id]), setNewActivityInput({...newActivityInput, [tarea.id]:''}))} 
                      className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-700 hover:rotate-90 transition-all shadow-lg shadow-blue-200 active:scale-90"
                    >
                      <Plus size={24} />
                    </button>
                  </div>

                  {/* Lista de actividades (Contenedor con scroll) */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                    {taskActivities.length > 0 ? taskActivities.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300">
                        <div className="flex-1 min-w-0 pr-4">
                          <span className={`text-sm block truncate font-bold tracking-tight ${a.isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                            {a.nombre}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Botón Estado: INICIADA */}
                          <button
                            onClick={() => onToggleActivity(a.id, 'isStarted')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 border-2 ${
                                a.isStarted 
                                ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                : 'bg-white text-slate-300 border-slate-50 hover:border-amber-100 hover:text-amber-500 hover:bg-amber-50/30'
                            }`}
                          >
                            <PlayCircle size={14} className={a.isStarted ? 'animate-pulse' : ''} />
                            INICIADA
                          </button>

                          {/* Botón Estado: FINALIZADA */}
                          <button
                            onClick={() => onToggleActivity(a.id, 'isCompleted')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 border-2 ${
                                a.isCompleted 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-white text-slate-300 border-slate-50 hover:border-green-100 hover:text-green-600 hover:bg-green-50/30'
                            }`}
                          >
                            <CheckCircle2 size={14} />
                            FINALIZADA
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem] gap-4 bg-white/50 backdrop-blur-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border border-slate-100">
                          <Send size={32} className="opacity-50" />
                        </div>
                        <div className="text-center">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Panel Vacío</span>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">Añade hitos operativos para esta tarea</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Filter size={40} />
             </div>
             <div>
                <h4 className="font-bold text-slate-800">Sin coincidencias</h4>
                <p className="text-sm text-slate-400">No hay tareas que coincidan con los filtros seleccionados.</p>
             </div>
             <button 
               onClick={resetFilters}
               className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700"
             >
               Ver Todas las Tareas
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
