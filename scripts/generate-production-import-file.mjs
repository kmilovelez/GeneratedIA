import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const outPath = path.join(root, 'public', 'datos_prueba_importacion.xlsx');

const files = {
  proyectos: path.join(dataDir, 'KPIWebAppProyectos.csv'),
  tareas: path.join(dataDir, 'KPIWebAppTareas.csv'),
  actividades: path.join(dataDir, 'KPIWebActividades.csv')
};

const HEADERS = [
  'Proyecto_Title',
  'Proyecto_OT',
  'Proyecto_ID_LineaNegocio',
  'Proyecto_ID_GerenteProyecto',
  'Proyecto_Estado',
  'Tarea_ID_Unico_Tarea',
  'Tarea_Title',
  'Tarea_ID_Disciplina',
  'Tarea_GerenteTarea',
  'Tarea_ID_Ejecutor',
  'Tarea_Estado',
  'Tarea_FPlaneadaInicioOrig',
  'Tarea_FPlaneadaFinOrig',
  'Tarea_FPlaneadaInicioAct',
  'Tarea_FPlaneadaFinAct',
  'Tarea_FEsperadaIni',
  'Tarea_FEsperadaFin',
  'Tarea_FRealInicio',
  'Tarea_FRealFin',
  'Tarea_RazonRetraso',
  'Actividad_Title',
  'Actividad_IsStarted',
  'Actividad_IsCompleted',
  'Actividad_FechaInicio',
  'Actividad_FechaFinalizacion',
  'Actividad_ID_Tarea_Legacy',
  'Actividad_razon_no_cumplimiento'
];

const normalize = (v) => String(v ?? '').trim();

const stripSharePointPrefix = (raw, firstHeader) => {
  const idx = raw.indexOf(firstHeader);
  if (idx < 0) throw new Error(`No se encontro encabezado: ${firstHeader}`);
  return raw.slice(idx);
};

const readCsvRows = (filePath, firstHeader) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const cleaned = stripSharePointPrefix(raw, firstHeader);
  const wb = XLSX.read(cleaned, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
};

const normalizeStatus = (status) => {
  const s = normalize(status).toUpperCase();
  if (s === 'FINISHED') return 'FINALIZADA';
  if (['DECK', 'WIP', 'FROZEN', 'FINALIZADA'].includes(s)) return s;
  return 'DECK';
};

const normalizeLinea = (linea) => {
  const l = normalize(linea).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (l === 'AEROPUERTOS') return 1;
  if (l === 'LOGISTICA') return 2;
  if (l === 'CARTON') return 3;
  return 1;
};

const normalizeDisciplina = (d) => {
  const v = normalize(d).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (v === 'SOFTWARE' || v === '1') return 1;
  if (v === 'CONTROL' || v === '2') return 2;
  if (v === 'MECANICA' || v === '3') return 3;
  return 2;
};

const toBool = (v) => normalize(v).toLowerCase() === 'true';

const main = () => {
  const proyectosRows = readCsvRows(files.proyectos, '"Title","OT","ID_LineaNegocio","ID_GerenteProyecto","Estado"');
  const tareasRows = readCsvRows(files.tareas, '"Title","OT","ID_Disciplina","GerenteTarea","ID_Ejecutor","Estado"');
  const actividadesRows = readCsvRows(files.actividades, '"Title","FechaInicio","FechaFinalizacion","IsStarted","IsCompleted","ID_Tarea"');

  const proyectosByOT = new Map();
  for (const p of proyectosRows) {
    const ot = normalize(p.OT);
    if (!ot) continue;
    proyectosByOT.set(ot, {
      title: normalize(p.Title),
      ot,
      linea: normalizeLinea(p.ID_LineaNegocio),
      gerente: normalize(p.ID_GerenteProyecto),
      estado: normalizeStatus(p.Estado)
    });
  }

  const actividadesByTaskId = new Map();
  for (const a of actividadesRows) {
    const taskId = normalize(a.ID_Tarea);
    if (!taskId) continue;
    if (!actividadesByTaskId.has(taskId)) actividadesByTaskId.set(taskId, []);
    actividadesByTaskId.get(taskId).push({
      title: normalize(a.Title),
      started: toBool(a.IsStarted),
      completed: toBool(a.IsCompleted),
      fechaInicio: normalize(a.FechaInicio),
      fechaFin: normalize(a.FechaFinalizacion)
    });
  }

  const rows = [];

  for (const t of tareasRows) {
    const ot = normalize(t.OT);
    const taskId = normalize(t.ID_Unico_Tarea) || `${ot}-${normalize(t.Title)}`;
    if (!ot || !taskId) continue;

    if (!proyectosByOT.has(ot)) {
      proyectosByOT.set(ot, {
        title: ot,
        ot,
        linea: 1,
        gerente: '',
        estado: 'DECK'
      });
    }

    const p = proyectosByOT.get(ot);

    const base = [
      p.title,
      p.ot,
      p.linea,
      p.gerente,
      p.estado,
      taskId,
      normalize(t.Title),
      normalizeDisciplina(t.ID_Disciplina),
      normalize(t.GerenteTarea),
      normalize(t.ID_Ejecutor),
      normalizeStatus(t.Estado),
      normalize(t.FPlaneadaInicioOrig),
      normalize(t.FPlaneadaFinOrig),
      normalize(t.FPlaneadaInicioAct),
      normalize(t.FPlaneadaFinAct),
      '',
      '',
      normalize(t.FRealInicio),
      normalize(t.FRealFin),
      normalize(t.RazonRetraso)
    ];

    const actividades = actividadesByTaskId.get(taskId) || [];
    if (actividades.length === 0) {
      rows.push([...base, '', false, false, '', '', '', '']);
      continue;
    }

    for (const a of actividades) {
      rows.push([
        ...base,
        a.title,
        a.started,
        a.completed,
        a.fechaInicio,
        a.fechaFin,
        '',
        ''
      ]);
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'datos');
  XLSX.writeFile(wb, outPath, { bookType: 'xlsx' });

  console.log(`Archivo generado: ${outPath}`);
  console.log(`Filas de datos: ${rows.length}`);
};

main();
