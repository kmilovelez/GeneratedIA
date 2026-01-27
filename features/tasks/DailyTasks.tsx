
import React, { useState } from 'react';
import { Plus, CheckSquare, Send, CheckCircle2 } from 'lucide-react';
import { Tarea, Actividad, Proyecto, User, ProjectStatus } from '../../types/index';
import { INITIAL_DISCIPLINAS, getStatusColor } from '../../lib/utils';

interface DailyTasksProps {
  tareas: Tarea[];
  actividades: Actividad[];
  proyectos: Proyecto[];
  users: User[];
  onAddTask: (task: Omit<Tarea, 'id' | 'estado' | 'fecha_creacion'>) => void;
  onUpdateTaskStatus: (id: number, status: ProjectStatus) => void;
  onAddActivity: (taskId: number, nombre: string) => void;
  onToggleActivity: (activityId: number) => void;
}

export const DailyTasks: React.FC<DailyTasksProps> = ({ 
  tareas, actividades, proyectos, users, 
  onAddTask, onUpdateTaskStatus, onAddActivity, onToggleActivity 
}) => {
  const [newActivityInput, setNewActivityInput] = useState<{ [key: number]: string }>({});
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    nombre: '',
    id_proyecto: proyectos[0]?.id || 1,
    id_disciplina: 1,
    id_ejecutor: users.find(u => u.rol === 'ejecutor')?.id || users[0].id,
    id_gerente_tarea: users.find(u => u.rol === 'gerente_tarea')?.id || users[0].id,
    fecha_planeada_inicio_original: '',
    fecha_planeada_fin_original: '',
  });

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
        <h2 className="text-2xl font-bold text-slate-800">Seguimiento Diario</h2>
        <button onClick={() => setIsAddingTask(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"><Plus size={18} /> Nueva Tarea</button>
      </header>

      {isAddingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddingTask(false)} />
          <form onSubmit={handleCreateTask} className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <h4 className="font-bold text-lg mb-6">Nueva Tarea</h4>
            <div className="space-y-4">
              <input type="text" className="w-full p-3 border rounded-xl outline-none" placeholder="Nombre" required value={newTaskForm.nombre} onChange={e => setNewTaskForm({...newTaskForm, nombre: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="p-2 border rounded-lg text-sm" required value={newTaskForm.fecha_planeada_inicio_original} onChange={e => setNewTaskForm({...newTaskForm, fecha_planeada_inicio_original: e.target.value})} />
                <input type="date" className="p-2 border rounded-lg text-sm" required value={newTaskForm.fecha_planeada_fin_original} onChange={e => setNewTaskForm({...newTaskForm, fecha_planeada_fin_original: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Confirmar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {tareas.map(tarea => {
          const taskActivities = actividades.filter(a => a.id_tarea === tarea.id);
          const progress = taskActivities.length > 0 ? Math.round((taskActivities.filter(a => a.cumplida).length / taskActivities.length) * 100) : 0;
          return (
            <div key={tarea.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-6 md:w-1/3 bg-slate-50 border-r border-slate-100 flex flex-col">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border w-fit ${getStatusColor(tarea.estado)}`}>{tarea.estado}</span>
                <h3 className="font-bold text-slate-800 text-lg mt-3">{tarea.nombre}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Disciplina: {INITIAL_DISCIPLINAS.find(d => d.id === tarea.id_disciplina)?.nombre}</p>
                <div className="mt-auto pt-6 flex gap-2">
                  <button onClick={() => onUpdateTaskStatus(tarea.id, 'wip')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-black uppercase transition">Iniciar</button>
                  <button onClick={() => onUpdateTaskStatus(tarea.id, 'finalizado')} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-black uppercase transition">Finalizar</button>
                </div>
              </div>
              <div className="p-6 flex-1">
                <div className="flex justify-between mb-4 items-center">
                  <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2"><CheckSquare size={16} className="text-blue-500" /> Actividades</h4>
                  <span className="text-xs font-black">{progress}%</span>
                </div>
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="Nueva actividad..." className="flex-1 p-2 border rounded-lg text-sm" value={newActivityInput[tarea.id] || ''} onChange={(e) => setNewActivityInput({ ...newActivityInput, [tarea.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && (onAddActivity(tarea.id, newActivityInput[tarea.id]), setNewActivityInput({...newActivityInput, [tarea.id]:''}))} />
                  <button onClick={() => (onAddActivity(tarea.id, newActivityInput[tarea.id]), setNewActivityInput({...newActivityInput, [tarea.id]:''}))} className="bg-blue-600 text-white p-2 rounded-lg"><Send size={18} /></button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {taskActivities.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg group transition">
                      <button onClick={() => onToggleActivity(a.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition ${a.cumplida ? 'bg-green-600 border-green-600 text-white' : 'border-slate-300'}`}><CheckCircle2 size={12} /></button>
                      <span className={`text-sm ${a.cumplida ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{a.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
