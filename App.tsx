
import React, { useState, useEffect } from 'react';
import { AccountInfo } from '@azure/msal-browser';

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
import {
  isMicrosoftConfigured,
  microsoftLoginRequest,
  msalInstance,
} from './lib/auth/microsoftAuth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'proyectos' | 'tareas' | 'reportes' | 'historicos' | 'admin' | 'import'>('dashboard');
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const buildUserFromAccount = (account: AccountInfo): User => ({
    id: Date.now(),
    nombre: account.name ?? account.username,
    email: account.username,
    rol: 'ejecutor',
  });

  const resolveUserFromAccount = (account: AccountInfo) => {
    setUsers(prev => {
      const existing = prev.find(user => user.email === account.username);
      if (existing) {
        setCurrentUser(existing);
        return prev;
      }
      const newUser = buildUserFromAccount(account);
      setCurrentUser(newUser);
      return [...prev, newUser];
    });
  };

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
        { id: 1, Title: 'Modernización Terminal A', OT: 'OT-1001', ID_LineaNegocio: 1, ID_GerenteProyecto: 2, Estado: 'WIP', fecha_creacion: yesterday.toISOString() },
        { id: 2, Title: 'Sistema Clasificación Logística', OT: 'OT-2005', ID_LineaNegocio: 2, ID_GerenteProyecto: 2, Estado: 'DECK', fecha_creacion: yesterday.toISOString() },
      ];
      const mockTasks: Tarea[] = [
        { 
          id: 1, ID_Unico_Tarea: 'OT-1001-DesAPI', OT: 'OT-1001', ID_Disciplina: 1, Title: 'Desarrollo API Central', 
          ID_Ejecutor: 4, GerenteTarea: 3, Estado: 'WIP',
          FPlaneadaInicioOrig: '2024-03-01', FPlaneadaFinOrig: '2024-03-30',
          FPlaneadaInicioAct: '2024-03-01', FPlaneadaFinAct: '2024-03-30',
          FEsperadaIni: '2024-03-05', FEsperadaFin: '2024-04-05',
          FRealInicio: yesterday.toISOString(),
          fecha_creacion: yesterday.toISOString()
        }
      ];
      const mockActivities: Actividad[] = [
        { id: 101, ID_Unico_Tarea: 'OT-1001-DesAPI', Title: 'Diseño de Base de Datos', IsStarted: true, IsCompleted: true, FechaInicio: yesterday.toISOString(), FechaFinalizacion: yesterday.toISOString(), fecha_creacion: yesterday.toISOString() },
        { id: 102, ID_Unico_Tarea: 'OT-1001-DesAPI', Title: 'Configuración Servidor', IsStarted: true, IsCompleted: false, FechaInicio: yesterday.toISOString(), fecha_creacion: yesterday.toISOString() }
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
    let isMounted = true;
    msalInstance.initialize().then(() => {
      if (!isMounted) return;
      const [account] = msalInstance.getAllAccounts();
      if (account) {
        resolveUserFromAccount(account);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (proyectos.length > 0 || users.length > DEFAULT_USERS.length) {
      localStorage.setItem('gestor_recursos_data', JSON.stringify({ users, proyectos, tareas, actividades, alertas }));
    }
  }, [users, proyectos, tareas, actividades, alertas]);

  const handleLogout = () => {
    const [account] = msalInstance.getAllAccounts();
    if (account) {
      msalInstance.logoutPopup({ account });
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleMicrosoftLogin = async () => {
    setAuthError(null);
    if (!isMicrosoftConfigured) {
      setAuthError('Falta configurar el acceso Microsoft en el entorno.');
      return;
    }
    try {
      const response = await msalInstance.loginPopup(microsoftLoginRequest);
      if (response.account) {
        resolveUserFromAccount(response.account);
      }
    } catch (error) {
      setAuthError('No se pudo iniciar sesión con Microsoft. Intenta nuevamente.');
    }
  };

  const addTask = (taskData: Omit<Tarea, 'id' | 'Estado' | 'fecha_creacion'>) => {
    const newTask: Tarea = {
      ...taskData,
      id: Date.now(),
      Estado: 'DECK',
      fecha_creacion: new Date().toISOString()
    };
    setTareas(prev => [...prev, newTask]);
  };

  const updateTaskStatus = (taskId: number, newStatus: ProjectStatus) => {
    setTareas(prev => prev.map(t => {
        if (t.id === taskId) {
            const updates: Partial<Tarea> = { Estado: newStatus };
            if (newStatus === 'FINALIZADA' && !t.FRealFin) {
                updates.FRealFin = new Date().toISOString();
            } else if (newStatus !== 'FINALIZADA' && t.FRealFin) {
                updates.FRealFin = undefined;
            }
            return { ...t, ...updates };
        }
        return t;
    }));
  };

  const updateTaskDates = (taskId: number, updates: Partial<Tarea>) => {
    setTareas(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const updateProject = (projectId: number, updates: Partial<Proyecto>) => {
    setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const addActivity = (taskId: string, title: string) => {
    const newActivity: Actividad = {
      id: Date.now(),
      ID_Unico_Tarea: taskId,
      Title: title,
      IsStarted: false,
      IsCompleted: false,
      fecha_creacion: new Date().toISOString()
    };
    setActividades(prev => [...prev, newActivity]);
  };

  const toggleActivity = (activityId: number, field: 'IsStarted' | 'IsCompleted') => {
    setActividades(prev => prev.map(a => {
      if (a.id === activityId) {
        const newVal = !a[field];
        const update: Partial<Actividad> = { [field]: newVal };
        
        if (field === 'IsStarted' && newVal) update.FechaInicio = new Date().toISOString();
        if (field === 'IsCompleted') {
            update.FechaFinalizacion = newVal ? new Date().toISOString() : undefined;
        }
        
        return { ...a, ...update };
      }
      return a;
    }));
  };

  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onMicrosoftLogin={handleMicrosoftLogin}
        isMicrosoftConfigured={isMicrosoftConfigured}
        authError={authError}
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
            onAddProject={(p) => setProyectos([...proyectos, {...p, id: Date.now(), Estado: 'DECK', fecha_creacion: new Date().toISOString()}])} 
            onUpdateProject={updateProject}
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
