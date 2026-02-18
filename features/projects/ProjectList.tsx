
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, X, Briefcase, Hash, UserCheck, Building2, Layers } from 'lucide-react';
import { Proyecto, User, ProjectStatus } from '../../types/index';
import { INITIAL_LINEAS } from '../../lib/utils';
import { getStatusColor } from '../../lib/utils';

interface ProjectListProps {
  proyectos: Proyecto[];
  users: User[];
  onAddProject: (project: Omit<Proyecto, 'id' | 'fecha_creacion'>) => void;
  onUpdateProject: (id: number, updates: Partial<Proyecto>) => void;
  onDeleteProject: (id: number) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ proyectos, users, onAddProject, onUpdateProject, onDeleteProject }) => {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  
  const initialFormState = {
    Title: '',
    OT: '',
    ID_LineaNegocio: 1,
    ID_GerenteProyecto: users.find(u => u.rol === 'gerente_proyecto')?.id || users[0]?.id || 1,
    Estado: 'DECK' as ProjectStatus,
  };

  const [projectForm, setProjectForm] = useState(initialFormState);

  const managers = useMemo(() => 
    users.filter(u => u.rol === 'gerente_proyecto'),
    [users]
  );

  const handleOpenCreate = () => {
    setProjectForm(initialFormState);
    setEditingProjectId(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEdit = (project: Proyecto) => {
    setProjectForm({
      Title: project.Title,
      OT: project.OT,
      ID_LineaNegocio: project.ID_LineaNegocio,
      ID_GerenteProyecto: project.ID_GerenteProyecto,
      Estado: project.Estado
    });
    setEditingProjectId(project.id);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.Title || !projectForm.OT) return;

    const payload = {
      Title: projectForm.Title,
      OT: projectForm.OT,
      ID_LineaNegocio: projectForm.ID_LineaNegocio,
      ID_GerenteProyecto: projectForm.ID_GerenteProyecto,
      Estado: projectForm.Estado
    };

    if (editingProjectId) {
      onUpdateProject(editingProjectId, payload);
    } else {
      onAddProject(payload);
    }
    
    setIsProjectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Proyectos</h2>
          <p className="text-sm text-slate-500 font-medium">Administración de portafolio y recursos estratégicos</p>
        </div>
        <button 
          onClick={handleOpenCreate} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition shadow-xl shadow-blue-100 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Nuevo Proyecto
        </button>
      </header>

      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsProjectModalOpen(false)} />
          <form onSubmit={handleSaveProject} className="relative bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  {editingProjectId ? <Edit2 size={24} strokeWidth={3} /> : <Plus size={24} strokeWidth={3} />}
               </div>
               <div>
                  <h4 className="font-black text-xl text-slate-800 leading-tight">
                    {editingProjectId ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">Completa los datos maestros del proyecto</p>
               </div>
               <button 
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="ml-auto p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
               >
                  <X size={20} strokeWidth={3} />
               </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                  <Briefcase size={12} /> Nombre del Proyecto
                </label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold placeholder:text-slate-300 shadow-sm" 
                  placeholder="Ej: Modernización Planta Norte" 
                  required 
                  value={projectForm.Title} 
                  onChange={e => setProjectForm({...projectForm, Title: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                  <Hash size={12} /> Orden de Trabajo (OT)
                </label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold placeholder:text-slate-300 shadow-sm" 
                  placeholder="Ej: OT-2024-001" 
                  required 
                  value={projectForm.OT} 
                  onChange={e => setProjectForm({...projectForm, OT: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                  <UserCheck size={12} /> Gerente de Proyecto
                </label>
                <select 
                  className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold appearance-none shadow-sm cursor-pointer" 
                  value={projectForm.ID_GerenteProyecto} 
                  onChange={e => setProjectForm({...projectForm, ID_GerenteProyecto: Number(e.target.value)})}
                >
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                  <Building2 size={12} /> Linea de Negocio
                </label>
                <select
                  className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold appearance-none shadow-sm cursor-pointer"
                  value={projectForm.ID_LineaNegocio}
                  onChange={e => setProjectForm({ ...projectForm, ID_LineaNegocio: Number(e.target.value) })}
                >
                  {INITIAL_LINEAS.map(linea => (
                    <option key={linea.id} value={linea.id}>{linea.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                  <Layers size={12} /> Estado
                </label>
                <select
                  className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-semibold appearance-none shadow-sm cursor-pointer"
                  value={projectForm.Estado}
                  onChange={e => setProjectForm({ ...projectForm, Estado: e.target.value as ProjectStatus })}
                >
                  <option value="DECK">DECK</option>
                  <option value="WIP">WIP</option>
                  <option value="FROZEN">FROZEN</option>
                  <option value="FINALIZADA">FINALIZADA</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                 <button 
                   type="button"
                   onClick={() => setIsProjectModalOpen(false)}
                   className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98]"
                 >
                    Cancelar
                 </button>
                 <button 
                   type="submit" 
                   className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                 >
                    {editingProjectId ? 'Guardar Cambios' : 'Crear Proyecto'}
                 </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Proyecto</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">OT</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Linea de Negocio</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gerente de Proyecto</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proyectos.map(p => {
              const manager = users.find(u => u.id === p.ID_GerenteProyecto);
              const linea = INITIAL_LINEAS.find(l => l.id === p.ID_LineaNegocio);
              return (
                <tr key={p.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                        {p.Title.substring(0, 1)}
                      </div>
                      <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{p.Title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{p.OT}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-semibold text-slate-600">{linea?.nombre || 'No asignada'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                          {manager?.nombre.substring(0, 2)}
                       </div>
                       <span className="text-xs font-semibold text-slate-600">{manager?.nombre || 'No asignado'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border ${getStatusColor(p.Estado)}`}>
                      {p.Estado}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEdit(p)} 
                        className="text-slate-400 hover:text-blue-500 p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-90"
                        title="Editar Proyecto"
                      >
                        <Edit2 size={16} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={() => onDeleteProject(p.id)} 
                        className="text-slate-400 hover:text-red-500 p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-90"
                        title="Eliminar Proyecto"
                      >
                        <Trash2 size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {proyectos.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
                <Briefcase size={40} className="opacity-20" />
             </div>
             <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No hay proyectos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};
