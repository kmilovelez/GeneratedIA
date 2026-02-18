import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const projectsCsvPath = 'C:/Users/jmazuera/Desktop/KpiWebAplication/KPIWebAppProyectos.csv';
const tasksCsvPath = 'C:/Users/jmazuera/Desktop/KpiWebAplication/KPIWebAppTareas.csv';
const activitiesCsvPath = 'C:/Users/jmazuera/Desktop/KpiWebAplication/KPIWebActividades.csv';

const readEnv = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
};

const cleanCsv = (filePath, headerStart) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const idx = raw.indexOf(headerStart);
  if (idx === -1) throw new Error(`Header not found: ${filePath}`);
  return raw.slice(idx);
};

const parseCsv = (csvText) => {
  const wb = XLSX.read(csvText, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
};

const normalizeText = (val) => String(val ?? '').trim();
const normalizeEmail = (val) => normalizeText(val).toLowerCase();
const toIsoOrNull = (val) => {
  const v = normalizeText(val);
  return v || null;
};

const statusMap = { DECK: 'DECK', WIP: 'WIP', FROZEN: 'FROZEN', FINISHED: 'FINALIZADA', FINALIZADA: 'FINALIZADA' };
const lineMap = { AEROPUERTOS: 1, LOGISTICA: 2, CARTON: 3 };

const normalizeStatus = (val) => {
  const key = normalizeText(val).toUpperCase();
  return statusMap[key] || 'DECK';
};

const normalizeLinea = (val) => {
  const key = normalizeText(val).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return lineMap[key] || 1;
};

const disciplinaToId = (val) => {
  const key = normalizeText(val).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (key === 'SOFTWARE') return 1;
  if (key === 'CONTROL') return 2;
  if (key === 'MECANICA') return 3;
  const n = Number(key);
  if (Number.isFinite(n) && n >= 1 && n <= 3) return n;
  return 2;
};

const formatNameFromEmail = (email) => {
  const local = email.split('@')[0] || email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
};

const main = async () => {
  const env = readEnv(envPath);
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const projectsRows = parseCsv(cleanCsv(projectsCsvPath, '"Title","OT","ID_LineaNegocio","ID_GerenteProyecto","Estado"'));
  const tasksRows = parseCsv(cleanCsv(tasksCsvPath, '"Title","OT","ID_Disciplina","GerenteTarea","ID_Ejecutor","Estado","RazonRetraso","FPlaneadaInicioOrig","FPlaneadaFinOrig","FPlaneadaInicioAct","FPlaneadaFinAct","FRealInicio","FRealFin","ID_Unico_Tarea","ID"'));
  const activitiesRows = parseCsv(cleanCsv(activitiesCsvPath, '"Title","FechaInicio","FechaFinalizacion","IsStarted","IsCompleted","ID_Tarea"'));

  const emailRoleMap = new Map();
  for (const r of projectsRows) {
    const email = normalizeEmail(r.ID_GerenteProyecto);
    if (email) emailRoleMap.set(email, 'gerente_proyecto');
  }
  for (const r of tasksRows) {
    const manager = normalizeEmail(r.GerenteTarea);
    const executor = normalizeEmail(r.ID_Ejecutor);
    if (manager && !emailRoleMap.has(manager)) emailRoleMap.set(manager, 'gerente_tarea');
    if (executor && !emailRoleMap.has(executor)) emailRoleMap.set(executor, 'ejecutor');
  }

  const usersRes = await supabase.from('users').select('id,email,rol');
  if (usersRes.error) throw usersRes.error;
  const existingUsers = usersRes.data || [];
  const emailToId = new Map(existingUsers.map((u) => [normalizeEmail(u.email), u.id]));
  let nextUserId = existingUsers.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;

  const usersToInsert = [];
  for (const [email, rol] of emailRoleMap.entries()) {
    if (!emailToId.has(email)) {
      usersToInsert.push({ id: nextUserId, nombre: formatNameFromEmail(email), email, rol });
      nextUserId += 1;
    }
  }

  if (usersToInsert.length) {
    const insRes = await supabase.from('users').insert(usersToInsert).select('id,email');
    if (insRes.error) throw insRes.error;
    for (const u of insRes.data || []) emailToId.set(normalizeEmail(u.email), u.id);
  }

  const allUsersRes = await supabase.from('users').select('id,email,rol').order('id', { ascending: true });
  if (allUsersRes.error) throw allUsersRes.error;
  const allUsers = allUsersRes.data || [];
  for (const u of allUsers) emailToId.set(normalizeEmail(u.email), u.id);

  const fallbackProjectManager = allUsers.find((u) => u.rol === 'gerente_proyecto')?.id;
  const fallbackTaskManager = allUsers.find((u) => u.rol === 'gerente_tarea')?.id;
  const fallbackExecutor = allUsers.find((u) => u.rol === 'ejecutor')?.id;
  if (!fallbackProjectManager || !fallbackTaskManager || !fallbackExecutor) {
    throw new Error('Fallback role users not found');
  }

  const projects = projectsRows
    .map((r) => ({
      title: normalizeText(r.Title),
      ot: normalizeText(r.OT),
      id_linea_negocio: normalizeLinea(r.ID_LineaNegocio),
      id_gerente_proyecto: emailToId.get(normalizeEmail(r.ID_GerenteProyecto)) || fallbackProjectManager,
      estado: normalizeStatus(r.Estado)
    }))
    .filter((p) => p.title && p.ot);

  const projectOtSet = new Set(projects.map((p) => p.ot));
  for (const r of tasksRows) {
    const ot = normalizeText(r.OT);
    if (!ot || projectOtSet.has(ot)) continue;
    projects.push({ title: ot, ot, id_linea_negocio: 1, id_gerente_proyecto: fallbackProjectManager, estado: 'DECK' });
    projectOtSet.add(ot);
  }

  const projUpsert = await supabase.from('proyectos').upsert(projects, { onConflict: 'ot' });
  if (projUpsert.error) throw projUpsert.error;

  const today = new Date().toISOString().slice(0, 10);
  const tasks = tasksRows
    .map((r) => {
      const title = normalizeText(r.Title);
      const ot = normalizeText(r.OT);
      const id_unico_tarea = normalizeText(r.ID_Unico_Tarea) || `${ot}-${title}`;
      return {
        title,
        ot,
        id_disciplina: disciplinaToId(r.ID_Disciplina),
        id_gerente_tarea: emailToId.get(normalizeEmail(r.GerenteTarea)) || fallbackTaskManager,
        id_ejecutor: emailToId.get(normalizeEmail(r.ID_Ejecutor)) || fallbackExecutor,
        estado: normalizeStatus(r.Estado),
        f_planeada_inicio_orig: normalizeText(r.FPlaneadaInicioOrig) || today,
        f_planeada_fin_orig: normalizeText(r.FPlaneadaFinOrig) || today,
        f_planeada_inicio_act: normalizeText(r.FPlaneadaInicioAct) || normalizeText(r.FPlaneadaInicioOrig) || today,
        f_planeada_fin_act: normalizeText(r.FPlaneadaFinAct) || normalizeText(r.FPlaneadaFinOrig) || today,
        f_esperada_ini: null,
        f_esperada_fin: null,
        f_real_inicio: toIsoOrNull(r.FRealInicio),
        f_real_fin: toIsoOrNull(r.FRealFin),
        razon_retraso: normalizeText(r.RazonRetraso) || null,
        id_unico_tarea
      };
    })
    .filter((t) => t.title && t.ot && t.id_unico_tarea);

  const taskUpsert = await supabase.from('tareas').upsert(tasks, { onConflict: 'id_unico_tarea' });
  if (taskUpsert.error) throw taskUpsert.error;

  const existingActRes = await supabase.from('actividades').select('id_unico_tarea,title');
  if (existingActRes.error) throw existingActRes.error;
  const activityKeys = new Set((existingActRes.data || []).map((a) => `${a.id_unico_tarea}::${a.title}`));

  const activitiesToInsert = activitiesRows
    .map((r) => ({
      id_unico_tarea: normalizeText(r.ID_Tarea),
      title: normalizeText(r.Title),
      is_started: normalizeText(r.IsStarted).toLowerCase() === 'true',
      is_completed: normalizeText(r.IsCompleted).toLowerCase() === 'true',
      fecha_inicio: toIsoOrNull(r.FechaInicio),
      fecha_finalizacion: toIsoOrNull(r.FechaFinalizacion)
    }))
    .filter((a) => a.id_unico_tarea && a.title)
    .filter((a) => {
      const k = `${a.id_unico_tarea}::${a.title}`;
      if (activityKeys.has(k)) return false;
      activityKeys.add(k);
      return true;
    });

  if (activitiesToInsert.length) {
    const actInsert = await supabase.from('actividades').insert(activitiesToInsert);
    if (actInsert.error) throw actInsert.error;
  }

  console.log(`Users inserted: ${usersToInsert.length}`);
  console.log(`Projects upserted: ${projects.length}`);
  console.log(`Tasks upserted: ${tasks.length}`);
  console.log(`Activities inserted: ${activitiesToInsert.length}`);
};

main().catch((err) => {
  console.error('CSV load error:', err.message || err);
  process.exit(1);
});
