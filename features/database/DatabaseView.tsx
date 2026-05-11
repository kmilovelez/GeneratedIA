import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Database, Filter, TableProperties } from 'lucide-react';
import { Actividad, Alerta, Proyecto, Tarea, User } from '../../types/index';
import { INITIAL_DISCIPLINAS, INITIAL_LINEAS } from '../../lib/utils';

interface DatabaseViewProps {
  users: User[];
  proyectos: Proyecto[];
  tareas: Tarea[];
  actividades: Actividad[];
  alertas: Alerta[];
}

type TableKey = 'users' | 'proyectos' | 'tareas' | 'actividades' | 'alertas';
type TableRow = Record<string, string>;

type TableDefinition = {
  key: TableKey;
  label: string;
  rows: TableRow[];
};

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  return String(value);
};

const toRows = <T extends object>(items: T[]): TableRow[] =>
  items.map((item) =>
    Object.entries(item).reduce<TableRow>((acc, [key, value]) => {
      acc[key] = stringifyValue(value);
      return acc;
    }, {})
  );

const TASK_HIDDEN_COLUMNS = ['ID_Disciplina', 'GerenteTarea', 'ID_Ejecutor'];
const TASK_DATE_FILTER_COLUMNS = [
  'FPlaneadaInicioOrig',
  'FPlaneadaFinOrig',
  'FPlaneadaInicioAct',
  'FPlaneadaFinAct',
  'FEsperadaIni',
  'FEsperadaFin',
  'FRealInicio',
  'FRealFin',
  'fecha_creacion'
];
const TASK_NON_FILTERABLE_COLUMNS = [
  ...TASK_DATE_FILTER_COLUMNS,
  'id',
  'Title',
  'ID_Unico_Tarea',
  'RazonRetraso'
];
const PROJECT_HIDDEN_COLUMNS = ['ID_LineaNegocio', 'ID_GerenteProyecto'];
const PROJECT_NON_FILTERABLE_COLUMNS = ['id', 'fecha_creacion'];

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  users,
  proyectos,
  tareas,
  actividades,
  alertas
}) => {
  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users]
  );

  const disciplinasById = useMemo(
    () => new Map(INITIAL_DISCIPLINAS.map((disciplina) => [disciplina.id, disciplina.nombre])),
    []
  );

  const lineasById = useMemo(
    () => new Map(INITIAL_LINEAS.map((linea) => [linea.id, linea.nombre])),
    []
  );

  const projectRows = useMemo(
    () =>
      toRows(
        proyectos.map((proyecto) => {
          const {
            ID_LineaNegocio: _idLineaNegocio,
            ID_GerenteProyecto: _idGerenteProyecto,
            ...rest
          } = proyecto;

          return {
            id: rest.id,
            Title: rest.Title,
            OT: rest.OT,
            Linea_de_negocio: lineasById.get(proyecto.ID_LineaNegocio) ?? 'Linea no encontrada',
            Gerente_de_proyecto: usersById.get(proyecto.ID_GerenteProyecto)?.nombre ?? 'Usuario no encontrado',
            Estado: rest.Estado,
            fecha_creacion: rest.fecha_creacion
          };
        })
      ),
    [lineasById, proyectos, usersById]
  );

  const taskRows = useMemo(
    () =>
      toRows(
        tareas.map((tarea) => {
          const {
            ID_Disciplina: _idDisciplina,
            GerenteTarea: _gerenteTarea,
            ID_Ejecutor: _idEjecutor,
            ...rest
          } = tarea;

          return {
            id: rest.id,
            Title: rest.Title,
            OT: rest.OT,
            Disciplina: disciplinasById.get(tarea.ID_Disciplina) ?? 'Disciplina no encontrada',
            Gerente_de_tarea: usersById.get(tarea.GerenteTarea)?.nombre ?? 'Usuario no encontrado',
            Ejecutor: usersById.get(tarea.ID_Ejecutor)?.nombre ?? 'Usuario no encontrado',
            Estado: rest.Estado,
            FPlaneadaInicioOrig: rest.FPlaneadaInicioOrig,
            FPlaneadaFinOrig: rest.FPlaneadaFinOrig,
            FPlaneadaInicioAct: rest.FPlaneadaInicioAct,
            FPlaneadaFinAct: rest.FPlaneadaFinAct,
            FEsperadaIni: rest.FEsperadaIni,
            FEsperadaFin: rest.FEsperadaFin,
            FRealInicio: rest.FRealInicio,
            FRealFin: rest.FRealFin,
            RazonRetraso: rest.RazonRetraso,
            ID_Unico_Tarea: rest.ID_Unico_Tarea,
            fecha_creacion: rest.fecha_creacion
          };
        })
      ),
    [disciplinasById, tareas, usersById]
  );

  const tables = useMemo<TableDefinition[]>(
    () => [
      { key: 'users', label: 'Usuarios', rows: toRows(users) },
      { key: 'proyectos', label: 'Proyectos', rows: projectRows },
      { key: 'tareas', label: 'Tareas', rows: taskRows },
      { key: 'actividades', label: 'Actividades', rows: toRows(actividades) },
      { key: 'alertas', label: 'Alertas', rows: toRows(alertas) }
    ],
    [users, projectRows, taskRows, actividades, alertas]
  );

  const [selectedTable, setSelectedTable] = useState<TableKey>('tareas');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);

  const currentTable = useMemo(
    () => tables.find((table) => table.key === selectedTable) ?? tables[0],
    [tables, selectedTable]
  );

  const columns = useMemo(() => {
    if (!currentTable) return [];
    const keys = new Set<string>();
    currentTable.rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
    const allColumns = Array.from(keys);

    if (selectedTable === 'proyectos') {
      return allColumns.filter((column) => !PROJECT_HIDDEN_COLUMNS.includes(column));
    }

    if (selectedTable === 'tareas') {
      return allColumns.filter((column) => !TASK_HIDDEN_COLUMNS.includes(column));
    }

    return allColumns;
  }, [currentTable, selectedTable]);

  const filterColumns = useMemo(() => {
    if (selectedTable === 'proyectos') {
      return columns.filter((column) => !PROJECT_NON_FILTERABLE_COLUMNS.includes(column));
    }

    if (selectedTable === 'tareas') {
      return columns.filter((column) => !TASK_NON_FILTERABLE_COLUMNS.includes(column));
    }

    return columns;
  }, [columns, selectedTable]);

  const columnOptions = useMemo(() => {
    return filterColumns.reduce<Record<string, string[]>>((acc, column) => {
      const values = new Set<string>(currentTable?.rows.map((row) => row[column] ?? '') ?? []);
      acc[column] = Array.from(values).sort((a, b) => a.localeCompare(b));
      return acc;
    }, {});
  }, [filterColumns, currentTable]);

  const filteredRows = useMemo(() => {
    if (!currentTable) return [];
    return currentTable.rows.filter((row) =>
      columns.every((column) => {
        if (!filterColumns.includes(column)) return true;
        const selectedValues = columnFilters[column];
        if (!selectedValues || selectedValues.length === 0) return false;
        return selectedValues.includes(row[column] ?? '');
      })
    );
  }, [currentTable, columns, filterColumns, columnFilters]);

  const activitiesByTask = useMemo(() => {
    return actividades.reduce<Record<string, Actividad[]>>((acc, activity) => {
      if (!acc[activity.ID_Unico_Tarea]) {
        acc[activity.ID_Unico_Tarea] = [];
      }
      acc[activity.ID_Unico_Tarea].push(activity);
      return acc;
    }, {});
  }, [actividades]);

  const filteredTaskRows = useMemo(() => {
    if (selectedTable !== 'tareas') return [];
    return filteredRows;
  }, [filteredRows, selectedTable]);

  const visibleTaskIds = useMemo(
    () => filteredTaskRows.map((row) => row.ID_Unico_Tarea).filter(Boolean),
    [filteredTaskRows]
  );

  const areAllTasksExpanded =
    selectedTable === 'tareas' &&
    visibleTaskIds.length > 0 &&
    visibleTaskIds.every((taskId) => expandedTaskIds.includes(taskId));

  useEffect(() => {
    if (filterColumns.length === 0) return;

    setColumnFilters((prev) =>
      filterColumns.reduce<Record<string, string[]>>((acc, column) => {
        const options = columnOptions[column] ?? [];
        const previousSelection = prev[column];

        if (!previousSelection) {
          acc[column] = options;
          return acc;
        }

        acc[column] = previousSelection.filter((value) => options.includes(value));
        return acc;
      }, {})
    );
  }, [filterColumns, columnOptions, selectedTable]);

  const handleTableChange = (tableKey: TableKey) => {
    setSelectedTable(tableKey);
    setColumnFilters({});
    setExpandedTaskIds([]);
  };

  const handleFilterToggle = (column: string, value: string) => {
    setColumnFilters((prev) => {
      const currentValues = prev[column] ?? [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      if (nextValues.length === 0) {
        const { [column]: _removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [column]: nextValues };
    });
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((item) => item !== taskId) : [...prev, taskId]
    );
  };

  const toggleAllTasks = () => {
    setExpandedTaskIds(areAllTasksExpanded ? [] : visibleTaskIds);
  };

  useEffect(() => {
    if (selectedTable !== 'tareas') return;
    setExpandedTaskIds((prev) => prev.filter((taskId) => visibleTaskIds.includes(taskId)));
  }, [selectedTable, visibleTaskIds]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-blue-600" size={28} />
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Base de Datos</h2>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Vista tabular de los datos cargados en la aplicacion, con filtros multiseleccion por columna.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-2 shadow-sm">
          {tables.map((table) => (
            <button
              key={table.key}
              onClick={() => handleTableChange(table.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                selectedTable === table.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {table.label}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-5 space-y-5">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Filtros por columna</span>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {filterColumns.map((column) => {
            const options = columnOptions[column] ?? [];
            const selectedValues = columnFilters[column] ?? [];
            const isAllSelected = options.length > 0 && selectedValues.length === options.length;
            const longestOptionLength = options.reduce((max, value) => Math.max(max, value.length), column.length);
            const panelWidth = Math.min(Math.max(longestOptionLength * 9, 180), 420);

            return (
              <details key={column} className="relative shrink-0" style={{ width: `${panelWidth}px` }}>
                <summary className="list-none cursor-pointer px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{column}</p>
                      <p className="text-[11px] font-bold text-slate-600 leading-none mt-1 truncate">
                        {isAllSelected ? 'Todos' : selectedValues.length}
                      </p>
                    </div>
                    <TableProperties size={14} className="text-slate-300 shrink-0" />
                  </div>
                </summary>
                <div className="absolute left-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 space-y-2 shadow-xl" style={{ width: `${panelWidth}px` }}>
                  <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer border-b border-slate-100 pb-2">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          [column]: e.target.checked ? options : []
                        }))
                      }
                    />
                    Seleccionar todos
                  </label>
                  <div className="space-y-2">
                    {options.map((value) => (
                      <label key={`${column}-${value}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(value)}
                          onChange={() => handleFilterToggle(column, value)}
                        />
                        <span className="truncate">{value || '(vacio)'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">{currentTable?.label}</h3>
            <p className="text-xs text-slate-500 font-semibold">
              {filteredRows.length} de {currentTable?.rows.length ?? 0} registros visibles
            </p>
          </div>
          {selectedTable === 'tareas' && (
            <button
              type="button"
              onClick={toggleAllTasks}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-100"
            >
              {areAllTasksExpanded ? 'Colapsar actividades' : 'Expandir actividades'}
            </button>
          )}
        </div>
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr>
                {selectedTable === 'tareas' && (
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 w-14">
                    <button
                      type="button"
                      onClick={toggleAllTasks}
                      className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 transition hover:bg-slate-100"
                      title={areAllTasksExpanded ? 'Colapsar actividades visibles' : 'Expandir actividades visibles'}
                    >
                      {areAllTasksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => {
                const taskId = row.ID_Unico_Tarea;
                const isTaskTable = selectedTable === 'tareas' && taskId;
                const isExpanded = isTaskTable ? expandedTaskIds.includes(taskId) : false;
                const taskActivities = isTaskTable ? activitiesByTask[taskId] ?? [] : [];

                return (
                  <React.Fragment key={`${currentTable?.key}-${index}`}>
                    <tr className="odd:bg-white even:bg-slate-50/50">
                      {isTaskTable && (
                        <td className="px-3 py-3 text-xs font-medium text-slate-700 border-b border-slate-100 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleTaskExpansion(taskId)}
                            className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 transition hover:bg-slate-50"
                            title={isExpanded ? 'Colapsar actividades' : 'Expandir actividades'}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                      )}
                      {columns.map((column, columnIndex) => (
                        <td
                          key={`${currentTable?.key}-${index}-${column}`}
                          className="px-4 py-3 text-xs font-medium text-slate-700 border-b border-slate-100 whitespace-nowrap"
                        >
                          {row[column] || '-'}
                        </td>
                      ))}
                    </tr>
                    {isTaskTable && isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={Math.max(columns.length + 1, 1)} className="px-6 py-4 border-b border-slate-100">
                          <div className="inline-block rounded-2xl border border-slate-200 bg-white overflow-hidden max-w-full">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Actividades de la tarea
                              </p>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {taskActivities.length} registros
                              </span>
                            </div>
                            <table className="w-auto text-xs table-auto">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                    Actividad
                                  </th>
                                  <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                    Fecha inicio real
                                  </th>
                                  <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                    Fecha fin real
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {taskActivities.map((activity) => (
                                  <tr key={activity.id} className="border-t border-slate-100">
                                    <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{activity.Title}</td>
                                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{activity.FechaInicio || '-'}</td>
                                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{activity.FechaFinalizacion || '-'}</td>
                                  </tr>
                                ))}
                                {taskActivities.length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center font-semibold text-slate-400">
                                      Esta tarea no tiene actividades registradas.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={Math.max(columns.length, 1)} className="px-6 py-10 text-center text-sm font-semibold text-slate-400">
                    No hay registros que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
