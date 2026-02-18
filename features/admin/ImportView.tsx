import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { dataRepository } from '../../lib/dataRepository';
import { Actividad, ProjectStatus, Proyecto, Tarea } from '../../types';

type ImportViewProps = {
  onImportSuccess?: () => Promise<void> | void;
};

type ImportedProject = Omit<Proyecto, 'id' | 'fecha_creacion'>;
type ImportedTask = Omit<Tarea, 'id' | 'fecha_creacion'>;
type ImportedActivity = Pick<Actividad, 'ID_Unico_Tarea' | 'Title' | 'IsStarted' | 'IsCompleted' | 'FechaInicio' | 'FechaFinalizacion' | 'ID_Tarea_Legacy' | 'razon_no_cumplimiento'>;

const EXPECTED_HEADERS = [
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
] as const;

const VALID_STATUSES = new Set<ProjectStatus>(['DECK', 'WIP', 'FROZEN', 'FINALIZADA']);

const toText = (value: unknown) => String(value ?? '').trim();

const toNumberField = (value: unknown, field: string, rowNumber: number): number => {
  const raw = toText(value);
  const parsed = Number(raw);
  if (!raw || Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    throw new Error(`Fila ${rowNumber}: el campo ${field} debe ser numerico.`);
  }
  return parsed;
};

const toStatusField = (value: unknown, field: string, rowNumber: number): ProjectStatus => {
  const raw = toText(value).toUpperCase() as ProjectStatus;
  if (!VALID_STATUSES.has(raw)) {
    throw new Error(`Fila ${rowNumber}: el campo ${field} debe ser uno de: DECK, WIP, FROZEN, FINALIZADA.`);
  }
  return raw;
};

const toBooleanField = (value: unknown, field: string, rowNumber: number): boolean => {
  const raw = toText(value).toLowerCase();
  if (!raw) return false;
  if (raw === 'true' || raw === '1' || raw === 'si' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  throw new Error(`Fila ${rowNumber}: el campo ${field} debe ser booleano (TRUE/FALSE).`);
};

const dateOrUndefined = (value: unknown): string | undefined => {
  const raw = toText(value);
  return raw || undefined;
};

const validateHeaders = (headers: string[]) => {
  const normalized = headers.map((h) => h.trim());
  const exactMatch =
    normalized.length === EXPECTED_HEADERS.length &&
    EXPECTED_HEADERS.every((expected, idx) => normalized[idx] === expected);

  if (!exactMatch) {
    const missing = EXPECTED_HEADERS.filter((expected) => !normalized.includes(expected));
    const extra = normalized.filter((h) => !EXPECTED_HEADERS.includes(h as (typeof EXPECTED_HEADERS)[number]));

    const parts: string[] = ['La estructura del Excel no es valida para la hoja "datos".'];
    if (missing.length > 0) parts.push(`Faltan columnas: ${missing.join(', ')}.`);
    if (extra.length > 0) parts.push(`Columnas no esperadas: ${extra.join(', ')}.`);
    parts.push('Descargue la plantilla oficial y vuelva a intentar.');

    throw new Error(parts.join(' '));
  }
};

const parseRows = (rows: unknown[][]) => {
  const projectsByOt = new Map<string, ImportedProject>();
  const tasksById = new Map<string, ImportedTask>();
  const activities: ImportedActivity[] = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const projectTitle = toText(row[0]);
    const projectOT = toText(row[1]);
    const projectEstado = toStatusField(row[4], 'Proyecto_Estado', rowNumber);

    const taskId = toText(row[5]);
    const taskTitle = toText(row[6]);
    const taskEstado = toStatusField(row[10], 'Tarea_Estado', rowNumber);

    if (!projectTitle || !projectOT) {
      throw new Error(`Fila ${rowNumber}: Proyecto_Title y Proyecto_OT son obligatorios.`);
    }
    if (!taskId || !taskTitle) {
      throw new Error(`Fila ${rowNumber}: Tarea_ID_Unico_Tarea y Tarea_Title son obligatorios.`);
    }

    const project: ImportedProject = {
      Title: projectTitle,
      OT: projectOT,
      ID_LineaNegocio: toNumberField(row[2], 'Proyecto_ID_LineaNegocio', rowNumber),
      ID_GerenteProyecto: toNumberField(row[3], 'Proyecto_ID_GerenteProyecto', rowNumber),
      Estado: projectEstado
    };

    const task: ImportedTask = {
      Title: taskTitle,
      OT: projectOT,
      ID_Disciplina: toNumberField(row[7], 'Tarea_ID_Disciplina', rowNumber),
      GerenteTarea: toNumberField(row[8], 'Tarea_GerenteTarea', rowNumber),
      ID_Ejecutor: toNumberField(row[9], 'Tarea_ID_Ejecutor', rowNumber),
      Estado: taskEstado,
      FPlaneadaInicioOrig: toText(row[11]),
      FPlaneadaFinOrig: toText(row[12]),
      FPlaneadaInicioAct: toText(row[13]),
      FPlaneadaFinAct: toText(row[14]),
      FEsperadaIni: dateOrUndefined(row[15]),
      FEsperadaFin: dateOrUndefined(row[16]),
      FRealInicio: dateOrUndefined(row[17]),
      FRealFin: dateOrUndefined(row[18]),
      RazonRetraso: dateOrUndefined(row[19]),
      ID_Unico_Tarea: taskId
    };

    if (!task.FPlaneadaInicioOrig || !task.FPlaneadaFinOrig || !task.FPlaneadaInicioAct || !task.FPlaneadaFinAct) {
      throw new Error(`Fila ${rowNumber}: las fechas planeadas de la tarea son obligatorias.`);
    }

    const existingProject = projectsByOt.get(projectOT);
    if (existingProject && JSON.stringify(existingProject) !== JSON.stringify(project)) {
      throw new Error(`Fila ${rowNumber}: Proyecto_OT ${projectOT} tiene datos inconsistentes en filas distintas.`);
    }
    projectsByOt.set(projectOT, project);

    const existingTask = tasksById.get(taskId);
    if (existingTask && JSON.stringify(existingTask) !== JSON.stringify(task)) {
      throw new Error(`Fila ${rowNumber}: Tarea_ID_Unico_Tarea ${taskId} tiene datos inconsistentes en filas distintas.`);
    }
    tasksById.set(taskId, task);

    const activityTitle = toText(row[20]);
    if (activityTitle) {
      activities.push({
        ID_Unico_Tarea: taskId,
        Title: activityTitle,
        IsStarted: toBooleanField(row[21], 'Actividad_IsStarted', rowNumber),
        IsCompleted: toBooleanField(row[22], 'Actividad_IsCompleted', rowNumber),
        FechaInicio: dateOrUndefined(row[23]),
        FechaFinalizacion: dateOrUndefined(row[24]),
        ID_Tarea_Legacy: dateOrUndefined(row[25]),
        razon_no_cumplimiento: dateOrUndefined(row[26])
      });
    }
  });

  return {
    projects: Array.from(projectsByOt.values()),
    tasks: Array.from(tasksById.values()),
    activities
  };
};

const importData = async (projects: ImportedProject[], tasks: ImportedTask[], activities: ImportedActivity[]) => {
  const current = await dataRepository.getAllData();

  const projectsByOT = new Map(current.proyectos.map((p) => [p.OT, p]));
  for (const project of projects) {
    const existing = projectsByOT.get(project.OT);
    if (existing) {
      await dataRepository.updateProject(existing.id, project);
    } else {
      const created = await dataRepository.createProject(project);
      projectsByOT.set(created.OT, created);
    }
  }

  const tasksByUniqueId = new Map(current.tareas.map((t) => [t.ID_Unico_Tarea, t]));
  for (const task of tasks) {
    const existing = tasksByUniqueId.get(task.ID_Unico_Tarea);
    if (existing) {
      await dataRepository.updateTask(existing.id, task);
    } else {
      const created = await dataRepository.createTask(task);
      tasksByUniqueId.set(created.ID_Unico_Tarea, created);
    }
  }

  const existingActivityKeys = new Set(current.actividades.map((a) => `${a.ID_Unico_Tarea}::${a.Title}`));
  for (const activity of activities) {
    const key = `${activity.ID_Unico_Tarea}::${activity.Title}`;
    if (existingActivityKeys.has(key)) continue;

    const created = await dataRepository.createActivity({
      ID_Unico_Tarea: activity.ID_Unico_Tarea,
      Title: activity.Title
    });

    const updates: Partial<Actividad> = {
      IsStarted: activity.IsStarted,
      IsCompleted: activity.IsCompleted,
      FechaInicio: activity.FechaInicio,
      FechaFinalizacion: activity.FechaFinalizacion,
      ID_Tarea_Legacy: activity.ID_Tarea_Legacy,
      razon_no_cumplimiento: activity.razon_no_cumplimiento
    };

    await dataRepository.updateActivity(created.id, updates);
    existingActivityKeys.add(key);
  }
};

const downloadTemplate = () => {
  const unifiedHeaders = [[...EXPECTED_HEADERS]];
  const unifiedSample = [[
    'Modernizacion Planta Norte',
    'OT-2026-001',
    1,
    2,
    'DECK',
    'OT-2026-001-T1',
    'Ingenieria de detalle',
    1,
    3,
    4,
    'WIP',
    '2026-03-01',
    '2026-03-15',
    '2026-03-01',
    '2026-03-18',
    '2026-03-05',
    '2026-03-20',
    '',
    '',
    '',
    'Levantamiento inicial',
    true,
    false,
    '2026-03-01T08:00:00.000Z',
    '',
    '',
    ''
  ]];

  const wb = XLSX.utils.book_new();
  const wsUnified = XLSX.utils.aoa_to_sheet([...unifiedHeaders, ...unifiedSample]);
  XLSX.utils.book_append_sheet(wb, wsUnified, 'datos');

  XLSX.writeFile(wb, 'plantilla_importacion_kpi.xls', { bookType: 'xls' });
};

export const ImportView: React.FC<ImportViewProps> = ({ onImportSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsImporting(true);

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets['datos'];
      if (!sheet) {
        throw new Error('No se encontro la hoja "datos". Use la plantilla oficial descargada desde la app.');
      }

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) as unknown[][];
      if (rows.length < 2) {
        throw new Error('La hoja "datos" no contiene filas de informacion para importar.');
      }

      validateHeaders((rows[0] || []).map((h) => toText(h)));

      const dataRows = rows.slice(1).filter((row) => row.some((cell) => toText(cell) !== ''));
      if (dataRows.length === 0) {
        throw new Error('La hoja "datos" esta vacia.');
      }

      const { projects, tasks, activities } = parseRows(dataRows);
      await importData(projects, tasks, activities);

      setSuccessMessage(`Importacion completada: ${projects.length} proyecto(s), ${tasks.length} tarea(s) y ${activities.length} actividad(es).`);
      if (onImportSuccess) {
        await onImportSuccess();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible importar el archivo.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4 shadow-inner max-w-2xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xls,.xlsx"
        className="hidden"
        onChange={(event) => void handleImportFile(event)}
      />

      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm"><Upload size={32} /></div>
      <h3 className="text-xl font-bold text-slate-800">Importacion de Datos</h3>
      <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
        Descargue la plantilla oficial .XLS para asegurar el formato correcto de Proyectos, Tareas y Actividades.
      </p>

      {errorMessage && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          {successMessage}
        </p>
      )}

      <div className="pt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={handleOpenFilePicker}
          disabled={isImporting}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isImporting ? 'Importando...' : 'Seleccionar Archivo'}
        </button>
        <button
          type="button"
          onClick={downloadTemplate}
          disabled={isImporting}
          className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-200 active:scale-95 transition inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Descargar plantilla .XLS
        </button>
        <a
          href="/datos_prueba_importacion.xlsx"
          download
          className="bg-emerald-100 text-emerald-800 px-6 py-3 rounded-xl font-bold border border-emerald-200 hover:bg-emerald-200 active:scale-95 transition inline-flex items-center gap-2"
        >
          <Download size={16} />
          Descargar datos de prueba
        </a>
      </div>
    </div>
  );
};
