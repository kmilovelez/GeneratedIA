import React, { useState } from 'react';
import { Briefcase, Filter, Timer, CalendarCheck, CheckSquare, AlertTriangle } from 'lucide-react';
import { Proyecto, Tarea, Actividad, Alerta, User } from '../../types/index';

// UI Components
import { ReportCard } from './components/ReportCard';
import { PreviewModal } from './components/PreviewModal';

// Logic Strategies
import { getProjectStatusData } from './strategies/projectStatus';
import { getScopeCreepData } from './strategies/scopeCreep';
import { getDurationData } from './strategies/duration';
import { getDeadlineData } from './strategies/deadline';
import { getDailyData } from './strategies/daily';
import { getAlertsData } from './strategies/alerts';

// Utils
import { generateExport, ExportFormat } from './utils/exportUtils';

interface ReportsViewProps {
  proyectos: Proyecto[];
  tareas: Tarea[];
  actividades: Actividad[];
  alertas: Alerta[];
  users: User[];
}

const REPORT_DEFINITIONS = [
  { id: 'proyectos', title: 'Estado de Proyectos', icon: Briefcase },
  { id: 'alcance', title: 'Alteración de Alcance', icon: Filter },
  { id: 'duracion', title: 'Cumplimiento Duración', icon: Timer },
  { id: 'cumplimiento_fecha', title: 'Cumplimiento en Fecha', icon: CalendarCheck },
  { id: 'cumplimiento_diario', title: 'Cumplimiento Diario', icon: CheckSquare },
  { id: 'alertas', title: 'Alertas Tempranas', icon: AlertTriangle }
];

export const ReportsView: React.FC<ReportsViewProps> = ({ proyectos, tareas, actividades, alertas, users }) => {
  const [generating, setGenerating] = useState<boolean>(false);
  const [previewReport, setPreviewReport] = useState<{title: string, data: any[], type: string} | null>(null);
  const [filters] = useState({ linea: 'all' });

  const calculateReportData = (type: string) => {
    switch(type) {
      case 'proyectos': return getProjectStatusData(proyectos, tareas, filters);
      case 'alcance': return getScopeCreepData(proyectos, tareas, actividades);
      case 'duracion': return getDurationData(tareas);
      case 'cumplimiento_fecha': return getDeadlineData(proyectos, tareas, users);
      case 'cumplimiento_diario': return getDailyData(proyectos, tareas, actividades, users);
      case 'alertas': return getAlertsData(alertas);
      default: return [];
    }
  };

  const handlePreview = (reportId: string, title: string) => {
    const data = calculateReportData(reportId);
    setPreviewReport({ title, data, type: reportId });
  };

  const handleExport = async (reportId: string, title: string, format: ExportFormat) => {
    setGenerating(true);
    // Simular pequeño retraso para feedback visual
    await new Promise(res => setTimeout(res, 300));
    const data = calculateReportData(reportId);
    generateExport(data, title, format);
    setGenerating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Centro de Reportes</h2>
          <p className="text-slate-500 font-medium">Inteligencia de datos para toma de decisiones estratégica</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORT_DEFINITIONS.map(report => (
          <ReportCard
            key={report.id}
            id={report.id}
            title={report.title}
            icon={report.icon}
            onPreview={() => handlePreview(report.id, report.title)}
            onExportPdf={() => handleExport(report.id, report.title, 'PDF')}
            onExportExcel={() => handleExport(report.id, report.title, 'EXCEL')}
            isGenerating={generating}
          />
        ))}
      </div>

      {previewReport && (
        <PreviewModal
          title={previewReport.title}
          data={previewReport.data}
          isGenerating={generating}
          onClose={() => setPreviewReport(null)}
          onExportPdf={() => handleExport(previewReport.type, previewReport.title, 'PDF')}
          onExportExcel={() => handleExport(previewReport.type, previewReport.title, 'EXCEL')}
        />
      )}
    </div>
  );
};
