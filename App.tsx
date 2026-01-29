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
import { msalInstance, msalInitPromise } from './config/auth';
import { getTasksFromSharePoint, updateActivityInSharePoint } from './services/microsoftGraph';

export default function App() {
  const [isMsAuthenticated, setIsMsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'proyectos' | 'tareas' | 'reportes' | 'admin' | 'import'>('dashboard');
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [msalReady, setMsalReady] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Verificación inicial de sesión de Microsoft tras inicialización
  useEffect(() => {
    msalInitPromise.then(async () => {
      try {
        // handleRedirectPromise resuelve cualquier interacción pendiente (especialmente útil si hubo un refresh)
        await msalInstance.handleRedirectPromise();
        
        setMsalReady(true);
        const account = msalInstance.getActiveAccount();
        if (account) {
          setIsMsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error inicializando MSAL:", error);
        setMsalReady(true); 
      }
    });
  }, []);

  // Carga de datos desde SharePoint cuando está autenticado
  useEffect(() => {
    if (isMsAuthenticated && msalReady) {
      loadDataFromSharePoint();
    }
  }, [isMsAuthenticated, msalReady]);

  const loadDataFromSharePoint = async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('gestor_recursos_data');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.users) setUsers(data.users);
        setProyectos(data.proyectos || []);
        setTareas(data.tareas || []);
        setActividades(data.actividades || []);
        setAlertas(data.alertas || []);
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        setProyectos([
          { id: 1, nombre: 'Modernización Terminal A', ot: 'OT-1001', id_linea_negocio: 1, id_gerente_proyecto: 2, estado: 'WIP', fecha_creacion: yesterday },
        ]);
        setTareas([
          { 
            id: 1, id_proyecto: 1, id_disciplina: 1, nombre: 'Desarrollo API Central', 
            id_ejecutor: 4, id_gerente_tarea: 3, estado: 'WIP',
            fecha_planeada_inicio_original: '2024-03-01', fecha_planeada_fin_original: '2024-03-30',
            fecha_planeada_inicio_actualizada: '2024-03-01', fecha_planeada_fin_actualizada: '2024-03-30',
            fecha_real_inicio: yesterday,
            fecha_creacion: yesterday
          }
        ]);
      }
    } catch (error) {
      console.error("Error cargando datos de Microsoft:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMsLogin = async () => {
    if (!msalReady || isInteracting) return;
    
    setIsInteracting(true);
    setAuthError(null);
    try {
      const loginRequest = {
        scopes: ["User.Read", "Sites.Read.All"],
        prompt: "select_account"
      };
      
      const result = await msalInstance.loginPopup(loginRequest);
      if (result) {
        msalInstance.setActiveAccount(result.account);
        setIsMsAuthenticated(true);
      }
    } catch (error: any) {
      let errorMessage = "Ocurrió un error inesperado durante el inicio de sesión.";
      
      if (error.name === "BrowserAuthError" && error.message.includes("timed_out")) {
        errorMessage = "La solicitud de inicio de sesión expiró. Por favor, comprueba tu conexión y vuelve a intentarlo.";
      } else if (error.name === "InteractionInProgressHandler") {
        errorMessage = "Una interacción ya está en curso en otra ventana.";
      } else if (error.name === "BrowserAuthError" && error.message.includes("user_cancelled")) {
        errorMessage = "Inicio de sesión cancelado por el usuario.";
      }
      
      console.error("Error en el login de Microsoft:", error);
      setAuthError(errorMessage);
    } finally {
      setIsInteracting(false);
    }
  };

  const handleLogout = async () => {
    if (!msalReady || isInteracting) return;
    
    setIsInteracting(true);
    try {
      setCurrentUser(null);
      setIsMsAuthenticated(false);
      await msalInstance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
        mainWindowRedirectUri: window.location.origin
      });
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Error en el logout de Microsoft:", error);
    } finally {
      setIsInteracting(false);
    }
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

  const updateProject = (projectId: number, updates: Partial<Proyecto>) => {
    setProyectos(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
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
            if (msalReady) updateActivityInSharePoint(a.id, update);
        }
        
        return { ...a, ...update };
      }
      return a;
    }));
  };

  if (!msalReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isMsAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center space-y-8 border border-slate-100">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl transform rotate-3">
            <span className="text-white font-black text-4xl">R</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bienvenido</h1>
            <p className="text-slate-500 mt-2 font-medium">Sistema de Gestión de KPIs Corporativo</p>
          </div>
          
          {authError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-600 font-bold leading-relaxed animate-in slide-in-from-top-2">
              {authError}
            </div>
          )}

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
            Para acceder a los tableros de control y cronogramas, por favor inicia sesión con tu cuenta de <strong>Office 365</strong>.
          </div>
          
          <button 
            disabled={isInteracting}
            onClick={handleMsLogin}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
              isInteracting 
              ? 'bg-slate-400 cursor-not-allowed text-white shadow-none' 
              : 'bg-slate-900 text-white shadow-slate-200 hover:bg-black'
            }`}
          >
            {isInteracting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f3f3f3" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/></svg>
            )}
            {isInteracting ? 'Procesando...' : 'Iniciar Sesión con Microsoft'}
          </button>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by Microsoft Graph API</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-md flex items-center justify-center flex-col gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Sincronizando con SharePoint...</p>
        </div>
      )}
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
        {activeTab === 'import' && <ImportView />}
        {activeTab === 'admin' && <AdminView users={users} />}
      </main>
    </div>
  );
}
