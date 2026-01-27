
import React from 'react';
import { Users } from 'lucide-react';
import { User } from '../../types/index';
import { getRoleBadgeColor } from '../../lib/utils';

interface AdminViewProps {
  users: User[];
}

export const AdminView: React.FC<AdminViewProps> = ({ users }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Administración</h2>
      <div className="bg-white rounded-xl border p-6 shadow-sm overflow-hidden">
        <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase tracking-widest text-xs"><Users size={16}/> Usuarios del Sistema</h4>
        <div className="divide-y divide-slate-100">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between py-4 transition hover:bg-slate-50 px-2 rounded-lg">
              <div><p className="font-bold text-sm text-slate-800">{u.nombre}</p><p className="text-xs text-slate-500">{u.email}</p></div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${getRoleBadgeColor(u.rol)}`}>{u.rol.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
