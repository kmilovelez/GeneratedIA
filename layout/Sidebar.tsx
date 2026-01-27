
import React from 'react';
import { LayoutDashboard, Briefcase, CheckSquare, BarChart3, Settings, Upload, LogOut, Shield } from 'lucide-react';
import { User } from '../types/index';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'proyectos' | 'tareas' | 'reportes' | 'admin' | 'import') => void;
  currentUser: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">R</div>
        <div>
          <h1 className="font-bold text-sm leading-tight">Recursos Compartidos</h1>
          <p className="text-xs text-slate-400">Sistema de Gestión</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button onClick={() => setActiveTab('proyectos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'proyectos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <Briefcase size={18} /> Proyectos
        </button>
        <button onClick={() => setActiveTab('tareas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'tareas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <CheckSquare size={18} /> Tareas Diarias
        </button>
        <button onClick={() => setActiveTab('reportes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'reportes' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <BarChart3 size={18} /> Reportes
        </button>
        <button onClick={() => setActiveTab('import')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'import' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
          <Upload size={18} /> Importar Datos
        </button>
        {currentUser.rol === 'administrador' && (
          <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${activeTab === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={18} /> Administración
          </button>
        )}
      </nav>
      <div className="p-4 border-t border-slate-800 mt-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold uppercase shadow-lg border border-slate-600">
            {currentUser.nombre.substring(0, 2)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold truncate">{currentUser.nombre}</p>
            <p className="text-[10px] text-slate-500 capitalize">{currentUser.rol.replace('_', ' ')}</p>
          </div>
          <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition" title="Cerrar Sesión"><LogOut size={16} /></button>
        </div>
        <div className="text-[10px] text-slate-600 text-center flex items-center justify-center gap-1">
            <Shield size={10}/> Local Mode
        </div>
      </div>
    </div>
  );
};
