
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

  useEffect(() => {
    msalInitPromise.then(async () => {
      try {
        await msalInstance.handleRedirectPromise();
        setMsalReady(true);
        const account = msalInstance.getActiveAccount();
        if (account) {
            setIsMsAuthenticated(true);
            // Si ya hay sesión activa recuperada, configuramos el usuario automáticamente
            setCurrentUser({
                id: 999,
                nombre: account.name || "Usuario Microsoft",
                email: account.username || "usuario@empresa.com",
                rol: 'administrador' // Rol por defecto para usuarios MS
            });
        }
      } catch (error) {
        console.error("Error inicializando MSAL:", error);
        setMsalReady(true); 
      }
    });
  }, []);

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
            id: 1, id_proyecto: 1, ID_Disciplina: "1", nombre: 'Desarrollo API Central', 
            ID_Ejecutor: "4", id_gerente_tarea: 3, estado: 'WIP',
            FPlaneadaInicioOrig: '2024-03-01', FPlaneadaFinOrig: '2024-03-30',
            FPlaneadaInicioAct: '2024-03-01', FPlaneadaFinAct: '2024-03-30',
            FRealInicio: yesterday,
            OT: 'OT-1001',
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

  const addTask = (taskData: any) => {
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

  const addActivity = (taskId: number, nombre: string) => {
    const newActivity: Actividad = {
      id: Date.now(),
      ID_Tarea: taskId,
      nombre,
      estado: 'DECK',
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
        const update: any = { [field]: newVal };
        
        if (field === 'IsStarted' && newVal) update.FechaInicio = new Date().toISOString();
        if (field === 'IsCompleted') {
            update.FechaFinalizacion = newVal ? new Date().toISOString() : undefined;
            update.estado = newVal ? 'FINALIZADA' : (a.IsStarted ? 'WIP' : 'DECK');
            if (msalReady) updateActivityInSharePoint(a.id, update);
        }
        
        return { ...a, ...update };
      }
      return a;
    }));
  };

  const handleMsLogin = async () => {
    if (!msalReady || isInteracting) return;
    setIsInteracting(true);
    setAuthError(null);
    try {
      const result = await msalInstance.loginPopup({ scopes: ["User.Read", "Sites.Read.All"], prompt: "select_account" });
      if (result) {
        msalInstance.setActiveAccount(result.account);
        setIsMsAuthenticated(true);
        
        // Creamos el usuario basado en la cuenta de Microsoft
        setCurrentUser({
            id: 999, // ID temporal
            nombre: result.account.name || "Usuario Microsoft",
            email: result.account.username || "usuario@empresa.com",
            rol: 'administrador' // Asignamos rol admin por defecto al dueño de la cuenta
        });

        // REDIRECCIÓN: Forzamos ir al Dashboard
        setActiveTab('dashboard');
      }
    } catch (error: any) {
      console.error("Error en login:", error);
      setAuthError("Error de autenticación.");
    } finally { setIsInteracting(false); }
  };

  const handleLogout = async () => {
    if (!msalReady || isInteracting) return;
    setIsInteracting(true);
    try {
      setCurrentUser(null);
      setIsMsAuthenticated(false);
      await msalInstance.logoutPopup();
    } finally { setIsInteracting(false); }
  };

  // 1. Cargando SDK
  if (!msalReady) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  // 2. Pantalla de Login Microsoft (Si no está autenticado)
  if (!isMsAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center space-y-8 border border-slate-100">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl"><span className="text-white font-black text-4xl">R</span></div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bienvenido</h1>
        <p className="text-slate-500 font-medium">Inicia sesión con tu cuenta corporativa para acceder a los recursos compartidos.</p>
        {authError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">{authError}</div>}
        <button onClick={handleMsLogin} disabled={isInteracting} className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-black transition-all shadow-xl shadow-slate-200">
            {isInteracting ? 'Conectando...' : 'Iniciar Sesión con Microsoft'}
        </button>
        
        <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-slate-400 font-bold uppercase tracking-widest">O modo local</span></div>
        </div>

        {/* Botón discreto para modo demo si falla MS */}
        <button onClick={() => setIsMsAuthenticated(true)} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition">
            Entrar en Modo Demostración
        </button>
      </div>
    </div>
  );

  // 3. Selección de Usuario Demo (Solo si estamos en modo Demo y no se ha seteado usuario automáticamente)
  if (!currentUser) return (
      <LoginScreen onLogin={(user) => { 
          setCurrentUser(user); 
          setActiveTab('dashboard'); // REDIRECCIÓN: Forzamos ir al Dashboard
      }} />
  );

  // 4. App Principal
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {loading && <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-md flex items-center justify-center flex-col gap-4"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="text-xs font-black text-blue-600 uppercase tracking-widest">Sincronizando...</p></div>}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 ml-64 p-8">
        {activeTab === 'dashboard' && <DashboardStats tareas={tareas} actividades={actividades} alertas={alertas} />}
        {activeTab === 'proyectos' && <ProjectList proyectos={proyectos} users={users} onAddProject={(p:any)=>setProyectos([...proyectos, {...p, id:Date.now(), estado:'DECK', fecha_creacion:new Date().toISOString()}])} onUpdateProject={(id,up)=>setProyectos(proyectos.map(p=>p.id===id?{...p,...up}:p))} onDeleteProject={(id)=>setProyectos(proyectos.filter(p=>p.id!==id))} />}
        {activeTab === 'tareas' && <DailyTasks tareas={tareas} actividades={actividades} proyectos={proyectos} users={users} onAddTask={addTask} onUpdateTaskStatus={updateTaskStatus} onUpdateTaskDates={updateTaskDates} onAddActivity={addActivity} onToggleActivity={toggleActivity} />}
        {activeTab === 'reportes' && <ReportsView proyectos={proyectos} tareas={tareas} actividades={actividades} alertas={alertas} users={users} />}
        {activeTab === 'import' && <ImportView />}
        {activeTab === 'admin' && <AdminView users={users} />}
      </main>
    </div>
  );
}
