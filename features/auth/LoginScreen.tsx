
import React from 'react';
import { User } from '../../types/index';
import { ShieldCheck, UserCircle2, ChevronRight } from 'lucide-react';
import { getRoleBadgeColor } from '../../lib/utils';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  users: User[];
  infoMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, users, infoMessage }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-slate-100">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3">
             <span className="text-white font-black text-3xl">R</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Recursos Compartidos</h1>
          <p className="text-slate-500 text-sm">Sistema de Gestión de Proyectos Empresarial</p>
        </div>
        <div className="p-8 bg-slate-50 space-y-6">
          <div className="text-sm text-slate-600 bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
             <ShieldCheck className="text-amber-600 shrink-0" size={20} />
             <p>{infoMessage || 'Modo demostracion. Seleccione un perfil para ingresar al sistema.'}</p>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Usuarios Disponibles</p>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => onLogin(user)}
                className="w-full bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-3 group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <UserCircle2 size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{user.nombre}</p>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border mt-1 ${getRoleBadgeColor(user.rol)}`}>
                    {user.rol.replace('_', ' ')}
                  </span>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
          
          <p className="text-center text-xs text-slate-400 mt-4">
            {infoMessage ? 'Verifica la configuracion para operar en modo remoto.' : 'Selecciona un perfil para comenzar.'}
          </p>
        </div>
      </div>
    </div>
  );
};
