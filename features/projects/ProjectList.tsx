
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Proyecto, User, ProjectStatus } from '../../types/index';

interface ProjectListProps {
  proyectos: Proyecto[];
  users: User[];
  onAddProject: (project: Omit<Proyecto, 'id' | 'estado' | 'fecha_creacion'>) => void;
  onDeleteProject: (id: number) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ proyectos, users, onAddProject, onDeleteProject }) => {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    nombre: '',
    id_linea_negocio: 1,
    id_gerente_proyecto: users.find(u => u.rol === 'gerente_proyecto')?.id || users[0]?.id || 1,
    estado: 'deck' as ProjectStatus
  });

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.nombre) return;
    onAddProject(projectForm);
    setIsProjectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Proyectos</h2>
        </div>
        <button onClick={() => setIsProjectModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
          <Plus size={18} /> Nuevo Proyecto
        </button>
      </header>

      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProjectModalOpen(false)} />
          <form onSubmit={handleSaveProject} className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <h4 className="font-bold text-blue-800 text-lg uppercase tracking-wider mb-6">Nuevo Proyecto</h4>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none" required value={projectForm.nombre} onChange={e => setProjectForm({...projectForm, nombre: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">Crear</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Proyecto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proyectos.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4 text-sm font-semibold">{p.nombre}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => onDeleteProject(p.id)} className="text-slate-400 hover:text-red-500 p-2 transition"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
