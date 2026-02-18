import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Role, User } from '../../types/index';
import { getRoleBadgeColor } from '../../lib/utils';

interface AdminViewProps {
  users: User[];
  onCreateUser: (user: Omit<User, 'id'>) => void | Promise<void>;
  onUpdateUser: (id: number, updates: Partial<Omit<User, 'id'>>) => void | Promise<void>;
  onDeleteUser: (id: number) => void | Promise<void>;
}

type UserFormState = {
  nombre: string;
  email: string;
  rol: Role;
};

const INITIAL_FORM: UserFormState = {
  nombre: '',
  email: '',
  rol: 'ejecutor'
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'gerente_proyecto', label: 'Gerente Proyecto' },
  { value: 'gerente_tarea', label: 'Gerente Tarea' },
  { value: 'lider_integracion', label: 'Lider Integracion' },
  { value: 'ejecutor', label: 'Ejecutor' }
];

export const AdminView: React.FC<AdminViewProps> = ({ users, onCreateUser, onUpdateUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(INITIAL_FORM);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({ nombre: user.nombre, email: user.email, rol: user.rol });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload: UserFormState = {
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      rol: form.rol
    };

    if (!payload.nombre || !payload.email) {
      setErrorMessage('Nombre y email son obligatorios.');
      return;
    }

    const emailAlreadyUsed = users.some(
      (u) => u.email.toLowerCase() === payload.email && u.id !== editingUser?.id
    );
    if (emailAlreadyUsed) {
      setErrorMessage('El email ya existe en otro usuario.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingUser) {
        await onUpdateUser(editingUser.id, payload);
      } else {
        await onCreateUser(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible guardar el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(`Eliminar usuario ${user.nombre}?`);
    if (!confirmed) return;

    try {
      await onDeleteUser(user.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No fue posible eliminar el usuario.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Administracion</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition"
        >
          <Plus size={16} /> Nuevo Usuario
        </button>
      </header>

      <div className="bg-white rounded-xl border p-6 shadow-sm overflow-hidden">
        <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase tracking-widest text-xs">
          <Users size={16} /> Usuarios del Sistema
        </h4>

        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-4 transition hover:bg-slate-50 px-2 rounded-lg">
              <div>
                <p className="font-bold text-sm text-slate-800">{u.nombre}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${getRoleBadgeColor(u.rol)}`}>
                  {u.rol.replace('_', ' ')}
                </span>
                <button
                  onClick={() => openEditModal(u)}
                  className="text-slate-400 hover:text-blue-500 p-2 rounded-lg border border-slate-200"
                  title="Editar usuario"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => void handleDelete(u)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-lg border border-slate-200"
                  title="Eliminar usuario"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSave} className="relative bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 space-y-5">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-lg text-slate-800">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="ml-auto p-2 text-slate-400 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400">Nombre</label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value as Role })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {errorMessage && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMessage}
              </p>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase disabled:opacity-60"
              >
                {isSaving ? 'Guardando...' : editingUser ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
