import { Actividad, Alerta, Proyecto, Tarea, User } from '../types';
import { DEFAULT_USERS } from './utils';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const STORAGE_KEY = 'gestor_recursos_data';

type AppData = {
  users: User[];
  proyectos: Proyecto[];
  tareas: Tarea[];
  actividades: Actividad[];
  alertas: Alerta[];
};

type NewProject = Omit<Proyecto, 'id' | 'fecha_creacion'>;
type NewTask = Omit<Tarea, 'id' | 'fecha_creacion'>;
type NewActivity = Pick<Actividad, 'ID_Unico_Tarea' | 'Title'>;

type DbUser = {
  id: number;
  nombre: string;
  email: string;
  rol: User['rol'];
};

type DbProject = {
  id: number;
  title: string;
  ot: string;
  id_linea_negocio: number;
  id_gerente_proyecto: number;
  estado: Proyecto['Estado'];
  fecha_creacion: string;
};

type DbTask = {
  id: number;
  title: string;
  ot: string;
  id_disciplina: number;
  id_gerente_tarea: number;
  id_ejecutor: number;
  estado: Tarea['Estado'];
  f_planeada_inicio_orig: string;
  f_planeada_fin_orig: string;
  f_planeada_inicio_act: string;
  f_planeada_fin_act: string;
  f_esperada_ini: string | null;
  f_esperada_fin: string | null;
  f_real_inicio: string | null;
  f_real_fin: string | null;
  razon_retraso: string | null;
  id_unico_tarea: string;
  fecha_creacion: string;
};

type DbActivity = {
  id: number;
  id_unico_tarea: string;
  title: string;
  is_started: boolean;
  is_completed: boolean;
  fecha_inicio: string | null;
  fecha_finalizacion: string | null;
  id_tarea_legacy: string | null;
  fecha_creacion: string;
  razon_no_cumplimiento: string | null;
};

type DbAlert = {
  id: number;
  tipo: Alerta['tipo'];
  id_tarea: number;
  mensaje: string;
  activa: boolean;
};

const toAppUser = (row: DbUser): User => row;

const toAppProject = (row: DbProject): Proyecto => ({
  id: row.id,
  Title: row.title,
  OT: row.ot,
  ID_LineaNegocio: row.id_linea_negocio,
  ID_GerenteProyecto: row.id_gerente_proyecto,
  Estado: row.estado,
  fecha_creacion: row.fecha_creacion
});

const toAppTask = (row: DbTask): Tarea => ({
  id: row.id,
  Title: row.title,
  OT: row.ot,
  ID_Disciplina: row.id_disciplina,
  GerenteTarea: row.id_gerente_tarea,
  ID_Ejecutor: row.id_ejecutor,
  Estado: row.estado,
  FPlaneadaInicioOrig: row.f_planeada_inicio_orig,
  FPlaneadaFinOrig: row.f_planeada_fin_orig,
  FPlaneadaInicioAct: row.f_planeada_inicio_act,
  FPlaneadaFinAct: row.f_planeada_fin_act,
  FEsperadaIni: row.f_esperada_ini ?? undefined,
  FEsperadaFin: row.f_esperada_fin ?? undefined,
  FRealInicio: row.f_real_inicio ?? undefined,
  FRealFin: row.f_real_fin ?? undefined,
  RazonRetraso: row.razon_retraso ?? undefined,
  ID_Unico_Tarea: row.id_unico_tarea,
  fecha_creacion: row.fecha_creacion
});

const toAppActivity = (row: DbActivity): Actividad => ({
  id: row.id,
  ID_Unico_Tarea: row.id_unico_tarea,
  Title: row.title,
  IsStarted: row.is_started,
  IsCompleted: row.is_completed,
  FechaInicio: row.fecha_inicio ?? undefined,
  FechaFinalizacion: row.fecha_finalizacion ?? undefined,
  ID_Tarea_Legacy: row.id_tarea_legacy ?? undefined,
  fecha_creacion: row.fecha_creacion,
  razon_no_cumplimiento: row.razon_no_cumplimiento ?? undefined
});

const toAppAlert = (row: DbAlert): Alerta => row;

const toDbProjectInsert = (project: NewProject) => ({
  title: project.Title,
  ot: project.OT,
  id_linea_negocio: project.ID_LineaNegocio,
  id_gerente_proyecto: project.ID_GerenteProyecto,
  estado: project.Estado
});

const toDbProjectUpdate = (updates: Partial<Proyecto>) => ({
  ...(updates.Title !== undefined ? { title: updates.Title } : {}),
  ...(updates.OT !== undefined ? { ot: updates.OT } : {}),
  ...(updates.ID_LineaNegocio !== undefined ? { id_linea_negocio: updates.ID_LineaNegocio } : {}),
  ...(updates.ID_GerenteProyecto !== undefined ? { id_gerente_proyecto: updates.ID_GerenteProyecto } : {}),
  ...(updates.Estado !== undefined ? { estado: updates.Estado } : {})
});

const toDbTaskInsert = (task: NewTask) => ({
  title: task.Title,
  ot: task.OT,
  id_disciplina: task.ID_Disciplina,
  id_gerente_tarea: task.GerenteTarea,
  id_ejecutor: task.ID_Ejecutor,
  estado: task.Estado,
  f_planeada_inicio_orig: task.FPlaneadaInicioOrig,
  f_planeada_fin_orig: task.FPlaneadaFinOrig,
  f_planeada_inicio_act: task.FPlaneadaInicioAct,
  f_planeada_fin_act: task.FPlaneadaFinAct,
  f_esperada_ini: task.FEsperadaIni ?? null,
  f_esperada_fin: task.FEsperadaFin ?? null,
  f_real_inicio: task.FRealInicio ?? null,
  f_real_fin: task.FRealFin ?? null,
  razon_retraso: task.RazonRetraso ?? null,
  id_unico_tarea: task.ID_Unico_Tarea
});

const toDbTaskUpdate = (updates: Partial<Tarea>) => ({
  ...(updates.Title !== undefined ? { title: updates.Title } : {}),
  ...(updates.OT !== undefined ? { ot: updates.OT } : {}),
  ...(updates.ID_Disciplina !== undefined ? { id_disciplina: updates.ID_Disciplina } : {}),
  ...(updates.GerenteTarea !== undefined ? { id_gerente_tarea: updates.GerenteTarea } : {}),
  ...(updates.ID_Ejecutor !== undefined ? { id_ejecutor: updates.ID_Ejecutor } : {}),
  ...(updates.Estado !== undefined ? { estado: updates.Estado } : {}),
  ...(updates.FPlaneadaInicioOrig !== undefined ? { f_planeada_inicio_orig: updates.FPlaneadaInicioOrig } : {}),
  ...(updates.FPlaneadaFinOrig !== undefined ? { f_planeada_fin_orig: updates.FPlaneadaFinOrig } : {}),
  ...(updates.FPlaneadaInicioAct !== undefined ? { f_planeada_inicio_act: updates.FPlaneadaInicioAct } : {}),
  ...(updates.FPlaneadaFinAct !== undefined ? { f_planeada_fin_act: updates.FPlaneadaFinAct } : {}),
  ...(updates.FEsperadaIni !== undefined ? { f_esperada_ini: updates.FEsperadaIni ?? null } : {}),
  ...(updates.FEsperadaFin !== undefined ? { f_esperada_fin: updates.FEsperadaFin ?? null } : {}),
  ...(updates.FRealInicio !== undefined ? { f_real_inicio: updates.FRealInicio ?? null } : {}),
  ...(updates.FRealFin !== undefined ? { f_real_fin: updates.FRealFin ?? null } : {}),
  ...(updates.RazonRetraso !== undefined ? { razon_retraso: updates.RazonRetraso ?? null } : {})
});

const toDbActivityInsert = (activity: NewActivity) => ({
  id_unico_tarea: activity.ID_Unico_Tarea,
  title: activity.Title
});

const toDbActivityUpdate = (updates: Partial<Actividad>) => ({
  ...(updates.Title !== undefined ? { title: updates.Title } : {}),
  ...(updates.IsStarted !== undefined ? { is_started: updates.IsStarted } : {}),
  ...(updates.IsCompleted !== undefined ? { is_completed: updates.IsCompleted } : {}),
  ...(updates.FechaInicio !== undefined ? { fecha_inicio: updates.FechaInicio ?? null } : {}),
  ...(updates.FechaFinalizacion !== undefined ? { fecha_finalizacion: updates.FechaFinalizacion ?? null } : {}),
  ...(updates.ID_Tarea_Legacy !== undefined ? { id_tarea_legacy: updates.ID_Tarea_Legacy ?? null } : {}),
  ...(updates.razon_no_cumplimiento !== undefined ? { razon_no_cumplimiento: updates.razon_no_cumplimiento ?? null } : {})
});

const getLocalData = (): AppData => {
  if (typeof window === 'undefined') {
    return { users: DEFAULT_USERS, proyectos: [], tareas: [], actividades: [], alertas: [] };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { users: DEFAULT_USERS, proyectos: [], tareas: [], actividades: [], alertas: [] };
  }
  const parsed = JSON.parse(raw);
  return {
    users: parsed.users ?? DEFAULT_USERS,
    proyectos: parsed.proyectos ?? [],
    tareas: parsed.tareas ?? [],
    actividades: parsed.actividades ?? [],
    alertas: parsed.alertas ?? []
  };
};

const setLocalData = (data: AppData) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const assertSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase no esta configurado.');
  }
  return supabase;
};

export const dataRepository = {
  isRemote: isSupabaseConfigured,
  async getAllData(): Promise<AppData> {
    if (!isSupabaseConfigured) {
      return getLocalData();
    }

    const client = assertSupabase();
    const [usersRes, projectsRes, tasksRes, activitiesRes, alertsRes] = await Promise.all([
      client.from('users').select('*').order('id', { ascending: true }),
      client.from('proyectos').select('*').order('id', { ascending: true }),
      client.from('tareas').select('*').order('id', { ascending: true }),
      client.from('actividades').select('*').order('id', { ascending: true }),
      client.from('alertas').select('*').order('id', { ascending: true })
    ]);

    if (usersRes.error) throw usersRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (tasksRes.error) throw tasksRes.error;
    if (activitiesRes.error) throw activitiesRes.error;
    if (alertsRes.error) throw alertsRes.error;

    return {
      users: (usersRes.data as DbUser[]).map(toAppUser),
      proyectos: (projectsRes.data as DbProject[]).map(toAppProject),
      tareas: (tasksRes.data as DbTask[]).map(toAppTask),
      actividades: (activitiesRes.data as DbActivity[]).map(toAppActivity),
      alertas: (alertsRes.data as DbAlert[]).map(toAppAlert)
    };
  },

  async upsertUsers(users: User[]) {
    if (!isSupabaseConfigured) {
      const local = getLocalData();
      setLocalData({ ...local, users });
      return;
    }

    const client = assertSupabase();
    const { error } = await client.from('users').upsert(users, { onConflict: 'id' });
    if (error) throw error;
  },

  async createProject(project: NewProject): Promise<Proyecto> {
    if (!isSupabaseConfigured) {
      const local = getLocalData();
      const created: Proyecto = {
        ...project,
        id: Date.now(),
        fecha_creacion: new Date().toISOString()
      };
      setLocalData({ ...local, proyectos: [...local.proyectos, created] });
      return created;
    }

    const client = assertSupabase();
    const { data, error } = await client.from('proyectos').insert(toDbProjectInsert(project)).select('*').single();
    if (error) throw error;
    return toAppProject(data as DbProject);
  },

  async updateProject(projectId: number, updates: Partial<Proyecto>): Promise<Proyecto> {
    if (!isSupabaseConfigured) {
      const local = getLocalData();
      const updated = local.proyectos.find((p) => p.id === projectId);
      if (!updated) throw new Error('Proyecto no encontrado.');
      const merged = { ...updated, ...updates };
      setLocalData({
        ...local,
        proyectos: local.proyectos.map((p) => (p.id === projectId ? merged : p))
      });
      return merged;
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from('proyectos')
      .update(toDbProjectUpdate(updates))
      .eq('id', projectId)
      .select('*')
      .single();
    if (error) throw error;
    return toAppProject(data as DbProject);
  },

  async deleteProject(projectId: number): Promise<void> {
    if (!isSupabaseConfigured) {
      const local = getLocalData();
      setLocalData({
        ...local,
        proyectos: local.proyectos.filter((p) => p.id !== projectId),
        tareas: local.tareas.filter((t) => t.OT !== local.proyectos.find((p) => p.id === projectId)?.OT),
        actividades: local.actividades.filter(
          (a) =>
            !local.tareas
              .filter((t) => t.OT === local.proyectos.find((p) => p.id === projectId)?.OT)
              .some((t) => t.ID_Unico_Tarea === a.ID_Unico_Tarea)
        )
      });
      return;
    }
    const client = assertSupabase();
    const { error } = await client.from('proyectos').delete().eq('id', projectId);
    if (error) throw error;
  },

  async createTask(task: NewTask): Promise<Tarea> {
    if (!isSupabaseConfigured) {
      const local = getLocalData();
      const created: Tarea = {
        ...task,
        id: Date.now(),
        fecha_creacion: new Date().toISOString()
      };
      setLocalData({ ...local, tareas: [...local.tareas, created] });
      return created;
    }

    const client = assertSupabase();
    const { data, error } = await client.from('tareas').insert(toDbTaskInsert(task)).select('*').single();
    if (error) throw error;
    return toAppTask(data as DbTask);
  },

  async updateTask(taskId: number, updates: Partial<Tarea>): Promise<Tarea> {
    if (!isSupabaseConfigured) {
      const local = getLocalData();
      const current = local.tareas.find((t) => t.id === taskId);
      if (!current) throw new Error('Tarea no encontrada.');
      const merged = { ...current, ...updates };
      setLocalData({
        ...local,
        tareas: local.tareas.map((t) => (t.id === taskId ? merged : t))
      });
      return merged;
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from('tareas')
      .update(toDbTaskUpdate(updates))
      .eq('id', taskId)
      .select('*')
      .single();
    if (error) throw error;
    return toAppTask(data as DbTask);
  },

  async createActivity(activity: NewActivity): Promise<Actividad> {
    if (!isSupabaseConfigured) {
      const local = getLocalData();
      const created: Actividad = {
        id: Date.now(),
        ID_Unico_Tarea: activity.ID_Unico_Tarea,
        Title: activity.Title,
        IsStarted: false,
        IsCompleted: false,
        fecha_creacion: new Date().toISOString()
      };
      setLocalData({ ...local, actividades: [...local.actividades, created] });
      return created;
    }

    const client = assertSupabase();
    const { data, error } = await client.from('actividades').insert(toDbActivityInsert(activity)).select('*').single();
    if (error) throw error;
    return toAppActivity(data as DbActivity);
  },

  async updateActivity(activityId: number, updates: Partial<Actividad>): Promise<Actividad> {
    if (!isSupabaseConfigured) {
      const local = getLocalData();
      const current = local.actividades.find((a) => a.id === activityId);
      if (!current) throw new Error('Actividad no encontrada.');
      const merged = { ...current, ...updates };
      setLocalData({
        ...local,
        actividades: local.actividades.map((a) => (a.id === activityId ? merged : a))
      });
      return merged;
    }

    const client = assertSupabase();
    const { data, error } = await client
      .from('actividades')
      .update(toDbActivityUpdate(updates))
      .eq('id', activityId)
      .select('*')
      .single();
    if (error) throw error;
    return toAppActivity(data as DbActivity);
  }
};
