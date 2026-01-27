
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
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);

      const mockProjects: Proyecto[] = [
        { id: 1, nombre: 'Modernización Terminal A', id_linea_negocio: 1, id_gerente_proyecto: 2, estado: 'wip', fecha_creacion: yesterday.toISOString() },
        { id: 2, nombre: 'Sistema Clasificación Logística', id_linea_negocio: 2, id_gerente_proyecto: 2, estado: 'deck', fecha_creacion: yesterday.toISOString() },
      ];
      const mockTasks: Tarea[] = [
        { 
          id: 1, id_proyecto: 1, id_disciplina: 1, nombre: 'Desarrollo API Central', 
          id_ejecutor: 4, id_gerente_tarea: 3, estado: 'wip',
          fecha_planeada_inicio_original: '2024-03-01', fecha_planeada_fin_original: '2024-03-30',
          fecha_planeada_inicio_actualizada: '2024-03-01', fecha_planeada_fin_actualizada: '2024-03-30',
          fecha_esperada_inicio: '2024-03-05', fecha_esperada_fin: '2024-04-05',
          fecha_real_inicio: yesterday.toISOString(),
          fecha_creacion: yesterday.toISOString()
        },
        { 
          id: 2, id_proyecto: 1, id_disciplina: 2, nombre: 'Instalación Sensores', 
          id_ejecutor: 4, id_gerente_tarea: 3, estado: 'wip',
          fecha_planeada_inicio_original: '2024-02-01', fecha_planeada_fin_original: '2024-02-15',
          fecha_planeada_inicio_actualizada: '2024-02-01', fecha_planeada_fin_actualizada: '2024-02-15',
          fecha_esperada_inicio: '2024-02-01', fecha_esperada_fin: '2024-02-15',
          fecha_real_inicio: '2024-02-01T08:00:00Z',
          fecha_creacion: yesterday.toISOString()
        },
        // --- NUEVA TAREA DE PRUEBA (FINALIZADA) ---
        { 
          id: 99, id_proyecto: 1, id_disciplina: 1, nombre: 'Tarea Histórica Finalizada', 
          id_ejecutor: 2, id_gerente_tarea: 3, estado: 'finalizado', // <--- Estado Finalizado
          fecha_planeada_inicio_original: '2024-01-01', fecha_planeada_fin_original: '2024-01-05',
          fecha_planeada_inicio_actualizada: '2024-01-01', fecha_planeada_fin_actualizada: '2024-01-05',
          fecha_real_inicio: '2024-01-01T09:00:00Z',
          fecha_real_fin: '2024-01-10T18:00:00Z', // <--- Tiene fecha real (5 días tarde)
          fecha_creacion: '2024-01-01T08:00:00Z'
        }
      ];
      const mockActivities: Actividad[] = [
        { id: 101, id_tarea: 1, nombre: 'Diseño de Base de Datos', estado: 'finalizado', cumplida: true, fecha_creacion: yesterday.toISOString() },
        { id: 102, id_tarea: 1, nombre: 'Configuración Servidor', estado: 'wip', cumplida: false, fecha_creacion: yesterday.toISOString() },
        { id: 103, id_tarea: 1, nombre: 'Elaboración planos infraestuctura', estado: 'wip', cumplida: false, fecha_creacion: yesterday.toISOString() },
        { id: 104, id_tarea: 2, nombre: 'Actividad Adicional Post-Creación', estado: 'wip', cumplida: false, fecha_creacion: now.toISOString() }
      ];
      setProyectos(mockProjects);
      setTareas(mockTasks);
      setActividades(mockActivities);
      
      setAlertas([
        { id: 1, tipo: 'retraso_inicio', id_tarea: 1, mensaje: 'La tarea "Desarrollo API Central" tiene un retraso de 3 días en su inicio planeado.', activa: true },
        { id: 2, tipo: 'retraso_finalizacion', id_tarea: 2, mensaje: 'Riesgo de cumplimiento en hito de finalización para Proyecto Aeropuertos.', activa: true }
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
      estado: 'deck',
      fecha_creacion: new Date().toISOString()
    };
    setTareas(prev => [...prev, newTask]);
  };

  const addProject = (projectData: Omit<Proyecto, 'id' | 'estado' | 'fecha_creacion'>) => {
    const newProject: Proyecto = {
      ...projectData,
      id: Date.now(),
      estado: 'deck',
      fecha_creacion: new Date().toISOString()
    };
    setProyectos(prev => [...prev, newProject]);
  };

  const deleteProject = (projectId: number) => {
    if (window.confirm("¿Está seguro de eliminar este proyecto?")) {
      setProyectos(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const updateTaskStatus = (taskId: number, newStatus: ProjectStatus) => {
    if (currentUser?.rol === 'ejecutor') return;

    setTareas(prev => prev.map(t => {
      if (t.id === taskId) {
        if (newStatus === 'finalizado') {
          const pending = actividades.filter(a => a.id_tarea === taskId && !a.cumplida);
          if (pending.length > 0) {
            alert("No se puede finalizar la tarea: tiene actividades pendientes.");
            return t;
          }
        }
        const update: Partial<Tarea> = { estado: newStatus };
        if (newStatus === 'wip' && !t.fecha_real_inicio) update.fecha_real_inicio = new Date().toISOString();
        if (newStatus === 'finalizado' && !t.fecha_real_fin) update.fecha_real_fin = new Date().toISOString();
        return { ...t, ...update };
      }
      return t;
    }));
  };

  const addActivity = (taskId: number, nombre: string) => {
    const newActivity: Actividad = {
      id: Date.now(),
      id_tarea: taskId,
      nombre,
      estado: 'deck',
      cumplida: false,
      fecha_creacion: new Date().toISOString()
    };
    setActividades(prev => [...prev, newActivity]);
  };

  const toggleActivity = (activityId: number) => {
    setActividades(prev => prev.map(a => {
      if (a.id === activityId) {
        const isFinishing = !a.cumplida;
        return { 
          ...a, 
          cumplida: isFinishing, 
          estado: isFinishing ? 'finalizado' : 'wip',
          fecha_finalizacion: isFinishing ? new Date().toISOString() : undefined
        };
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
            onAddProject={addProject} 
            onDeleteProject={deleteProject} 
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
