
import React, { useState, useEffect } from 'react';

import { Sidebar } from './layout/Sidebar';
import { LoginScreen } from './features/auth/LoginScreen';
import { DashboardStats } from './features/dashboard/DashboardStats';
import { ProjectList } from './features/projects/ProjectList';
import { DailyTasks } from './features/tasks/DailyTasks';
import { ReportsView } from './features/reports/ReportsView';
import { AdminView } from './features/admin/AdminView';
import { ImportView } from './features/admin/ImportView';

import { User, Proyecto, Tarea, Actividad, Alerta, ProjectStatus } from './types/index';
import { DEFAULT_USERS } from './lib/utils';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'proyectos' | 'tareas' | 'reportes' | 'admin' | 'import'>('dashboard');
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem('gestor_recursos_data');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.users) setUsers(data.users);
      setProyectos(data.proyectos || []);
      setTareas(data.tareas || []);
      setActividades(data.actividades || []);
      setAlertas(data.alertas || []);
    } else {
      const yesterday = new Date(Date.now() - 86400000);

      const mockProjects: Proyecto[] = [
        { id: 1, nombre: 'Modernización Terminal A', id_linea_negocio: 1, id_gerente_proyecto: 2, estado: 'WIP', fecha_creacion: yesterday.toISOString() },
        { id: 2, nombre: 'Sistema Clasificación Logística', id_linea_negocio: 2, id_gerente_proyecto: 2, estado: 'DECK', fecha_creacion: yesterday.toISOString() },
      ];
      const mockTasks: Tarea[] = [
        { 
          id: 1, id_proyecto: 1, id_disciplina: 1, nombre: 'Desarrollo API Central', 
          id_ejecutor: 4, id_gerente_tarea: 3, estado: 'WIP',
          fecha_planeada_inicio_original: '2024-03-01', fecha_planeada_fin_original: '2024-03-30',
          fecha_planeada_inicio_actualizada: '2024-03-01', fecha_planeada_fin_actualizada: '2024-03-30',
          fecha_esperada_inicio: '2024-03-05', fecha_esperada_fin: '2024-04-05',
          fecha_real_inicio: yesterday.toISOString(),
          fecha_creacion: yesterday.toISOString()
        }
      ];
      const mockActivities: Actividad[] = [
        { id: 101, id_tarea: 1, nombre: 'Diseño de Base de Datos', estado: 'FINALIZADA', isStarted: true, isCompleted: true, fecha_creacion: yesterday.toISOString() },
        { id: 102, id_tarea: 1, nombre: 'Configuración Servidor', estado: 'WIP', isStarted: true, isCompleted: false, fecha_creacion: yesterday.toISOString() }
      ];
      setProyectos(mockProjects);
      setTareas(mockTasks);
      setActividades(mockActivities);
      
      setAlertas([
        { id: 1, tipo: 'retraso_inicio', id_tarea: 1, mensaje: 'La tarea "Desarrollo API Central" tiene un retraso de 3 días en su inicio planeado.', activa: true }
      ]);
    }
  }, []);

  useEffect(() => {
    if (proyectos.length > 0 || users.length > DEFAULT_USERS.length) {
      localStorage.setItem('gestor_recursos_data', JSON.stringify({ users, proyectos, tareas, actividades, alertas }));
    }
  }, [users, proyectos, tareas, actividades, alertas]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const addTask = (taskData: Omit<Tarea, 'id' | 'estado' | 'fecha_creacion'>) => {
    const newTask: Tarea = {
      ...taskData,
      id: Date.now(),
      estado: 'DECK',
      fecha_creacion: new Date().toISOString()
    };
    setTareas(prev => [...prev, newTask]);
  };

  const updateTaskStatus = (taskId: number, newStatus: ProjectStatus) => {
    setTareas(prev => prev.map(t => {
        if (t.id === taskId) {
            const updates: Partial<Tarea> = { estado: newStatus };
            if (newStatus === 'FINALIZADA' && !t.fecha_real_fin) {
                updates.fecha_real_fin = new Date().toISOString();
            } else if (newStatus !== 'FINALIZADA' && t.fecha_real_fin) {
                updates.fecha_real_fin = undefined;
            }
            return { ...t, ...updates };
        }
        return t;
    }));
  };

  const updateTaskDates = (taskId: number, updates: Partial<Tarea>) => {
    setTareas(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const addActivity = (taskId: number, nombre: string) => {
    const newActivity: Actividad = {
      id: Date.now(),
      id_tarea: taskId,
      nombre,
      estado: 'DECK',
      isStarted: false,
      isCompleted: false,
      fecha_creacion: new Date().toISOString()
    };
    setActividades(prev => [...prev, newActivity]);
  };

  const toggleActivity = (activityId: number, field: 'isStarted' | 'isCompleted') => {
    setActividades(prev => prev.map(a => {
      if (a.id === activityId) {
        const newVal = !a[field];
        const update: Partial<Actividad> = { [field]: newVal };
        
        if (field === 'isStarted' && newVal) update.fecha_inicio = new Date().toISOString();
        if (field === 'isCompleted') {
            update.fecha_finalizacion = newVal ? new Date().toISOString() : undefined;
            update.estado = newVal ? 'FINALIZADA' : (a.isStarted ? 'WIP' : 'DECK');
        }
        
        return { ...a, ...update };
      }
      return a;
    }));
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
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
            onAddProject={(p) => setProyectos([...proyectos, {...p, id: Date.now(), estado: 'DECK', fecha_creacion: new Date().toISOString()}])} 
            onDeleteProject={(id) => setProyectos(proyectos.filter(p => p.id !== id))} 
          />
        )}
        {activeTab === 'tareas' && (
          <DailyTasks 
            tareas={tareas} 
            actividades={actividades} 
            proyectos={proyectos} 
            users={users} 
            onAddTask={addTask}
            onUpdateTaskStatus={updateTaskStatus}
            onUpdateTaskDates={updateTaskDates}
            onAddActivity={addActivity}
            onToggleActivity={toggleActivity}
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
        {activeTab === 'import' && <ImportView />}
        {activeTab === 'admin' && <AdminView users={users} />}
      </main>
    </div>
  );
}
