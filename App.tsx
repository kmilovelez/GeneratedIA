
import React, { useState, useEffect } from 'react';

import { Sidebar } from './layout/Sidebar';
import { LoginScreen } from './features/auth/LoginScreen';
import { DashboardStats } from './features/dashboard/DashboardStats';
import { ProjectList } from './features/projects/ProjectList';
import { DailyTasks } from './features/tasks/DailyTasks';
import { ReportsView } from './features/reports/ReportsView';
import { HistoricosView } from './features/historicos/HistoricosView';
import { AdminView } from './features/admin/AdminView';
import { ImportView } from './features/admin/ImportView';

import { User, Proyecto, Tarea, Actividad, Alerta, ProjectStatus } from './types/index';
import { DEFAULT_USERS } from './lib/utils';
import { dataRepository } from './lib/dataRepository';
import { isSupabaseConfigured } from './lib/supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'proyectos' | 'tareas' | 'reportes' | 'historicos' | 'admin' | 'import'>('dashboard');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setIsLoadingData(true);
      setDataError(null);
      try {
        const data = await dataRepository.getAllData();
        if (!active) return;

        const loadedUsers = data.users.length > 0 ? data.users : DEFAULT_USERS;
        setUsers(loadedUsers);
        setProyectos(data.proyectos);
        setTareas(data.tareas);
        setActividades(data.actividades);
        setAlertas(data.alertas);

        if (data.users.length === 0) {
          await dataRepository.upsertUsers(DEFAULT_USERS);
        }
      } catch (error) {
        if (!active) return;
        setDataError(error instanceof Error ? error.message : 'No fue posible cargar los datos.');
      } finally {
        if (active) setIsLoadingData(false);
      }
    };
    loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const addProject = async (projectData: Omit<Proyecto, 'id' | 'Estado' | 'fecha_creacion'>) => {
    const created = await dataRepository.createProject(projectData);
    setProyectos(prev => [...prev, created]);
  };

  const deleteProject = async (projectId: number) => {
    await dataRepository.deleteProject(projectId);
    const deletedProject = proyectos.find((p) => p.id === projectId);
    const deletedOT = deletedProject?.OT;
    const deletedTaskIds = new Set(tareas.filter((t) => t.OT === deletedOT).map((t) => t.ID_Unico_Tarea));
    setProyectos(prev => prev.filter((p) => p.id !== projectId));
    setTareas(prev => prev.filter((t) => t.OT !== deletedOT));
    setActividades(prev => prev.filter((a) => !deletedTaskIds.has(a.ID_Unico_Tarea)));
  };

  const addTask = async (taskData: Omit<Tarea, 'id' | 'Estado' | 'fecha_creacion'>) => {
    const created = await dataRepository.createTask(taskData);
    setTareas(prev => [...prev, created]);
  };

  const updateTaskStatus = async (taskId: number, newStatus: ProjectStatus) => {
    const current = tareas.find((t) => t.id === taskId);
    if (!current) return;
    const updates: Partial<Tarea> = { Estado: newStatus };
    if (newStatus === 'FINALIZADA' && !current.FRealFin) {
      updates.FRealFin = new Date().toISOString();
    } else if (newStatus !== 'FINALIZADA' && current.FRealFin) {
      updates.FRealFin = undefined;
    }
    const updated = await dataRepository.updateTask(taskId, updates);
    setTareas(prev => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const updateTaskDates = async (taskId: number, updates: Partial<Tarea>) => {
    const updated = await dataRepository.updateTask(taskId, updates);
    setTareas(prev => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const updateProject = async (projectId: number, updates: Partial<Proyecto>) => {
    const updated = await dataRepository.updateProject(projectId, updates);
    setProyectos(prev => prev.map((p) => (p.id === projectId ? updated : p)));
  };

  const addActivity = async (taskId: string, title: string) => {
    if (!title?.trim()) return;
    const created = await dataRepository.createActivity({
      ID_Unico_Tarea: taskId,
      Title: title.trim()
    });
    setActividades(prev => [...prev, created]);
  };

  const toggleActivity = async (activityId: number, field: 'IsStarted' | 'IsCompleted') => {
    const current = actividades.find((a) => a.id === activityId);
    if (!current) return;

    const newVal = !current[field];
    const updates: Partial<Actividad> = { [field]: newVal };

    if (field === 'IsStarted' && newVal) {
      updates.FechaInicio = new Date().toISOString();
    }
    if (field === 'IsCompleted') {
      updates.FechaFinalizacion = newVal ? new Date().toISOString() : undefined;
    }

    const updated = await dataRepository.updateActivity(activityId, updates);
    setActividades(prev => prev.map((a) => (a.id === activityId ? updated : a)));
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 px-8 py-6 text-slate-600 text-sm font-bold">
          Cargando datos desde {isSupabaseConfigured ? 'Supabase' : 'almacenamiento local'}...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        users={users}
        infoMessage={dataError ?? (!isSupabaseConfigured ? 'Supabase no configurado, usando almacenamiento local.' : null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 ml-64 p-8">
        {activeTab === 'dashboard' && (
          <DashboardStats tareas={tareas} actividades={actividades} alertas={alertas} />
        )}
        {activeTab === 'proyectos' && (
          <ProjectList 
            proyectos={proyectos} 
            users={users} 
            onAddProject={(p) => void addProject(p)}
            onUpdateProject={(id, updates) => void updateProject(id, updates)}
            onDeleteProject={(id) => void deleteProject(id)}
          />
        )}
        {activeTab === 'tareas' && (
          <DailyTasks 
            tareas={tareas} 
            actividades={actividades} 
            proyectos={proyectos} 
            users={users} 
            onAddTask={(task) => void addTask(task)}
            onUpdateTaskStatus={(id, status) => void updateTaskStatus(id, status)}
            onUpdateTaskDates={(id, updates) => void updateTaskDates(id, updates)}
            onAddActivity={(taskId, title) => void addActivity(taskId, title)}
            onToggleActivity={(activityId, field) => void toggleActivity(activityId, field)}
          />
        )}
        {activeTab === 'reportes' && (
          <ReportsView 
            proyectos={proyectos} 
            tareas={tareas} 
            actividades={actividades} 
            alertas={alertas}
            users={users} 
          />
        )}
        {activeTab === 'historicos' && (
          <HistoricosView 
            tareas={tareas} 
            actividades={actividades} 
          />
        )}
        {activeTab === 'import' && <ImportView />}
        {activeTab === 'admin' && <AdminView users={users} />}
      </main>
    </div>
  );
}
