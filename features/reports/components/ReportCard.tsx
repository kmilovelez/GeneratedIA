
import React from 'react';
import { LucideIcon, Download, FileSpreadsheet } from 'lucide-react';

interface ReportCardProps {
  id: string;
  title: string;
  icon: LucideIcon;
  onPreview: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  isGenerating: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({ 
  title, icon: Icon, onPreview, onExportPdf, onExportExcel, isGenerating 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition relative group">
      <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 transition group-hover:bg-blue-600 group-hover:text-white">
        <Icon size={24} />
      </div>
      <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
      <button 
        onClick={onPreview} 
        className="w-full mb-3 text-xs font-bold text-blue-600 bg-blue-50 py-2 rounded-lg hover:bg-blue-100 transition"
      >
        Vista Previa
      </button>
      <div className="flex gap-2">
        <button 
          disabled={isGenerating} 
          onClick={onExportPdf} 
          className="flex-1 text-[10px] font-black border py-2 rounded-lg uppercase hover:bg-slate-50 transition flex items-center justify-center gap-1 disabled:opacity-50"
        >
          PDF
        </button>
        <button 
          disabled={isGenerating} 
          onClick={onExportExcel} 
          className="flex-1 text-[10px] font-black border py-2 rounded-lg uppercase hover:bg-slate-50 transition flex items-center justify-center gap-1 disabled:opacity-50"
        >
          Excel
        </button>
      </div>
    </div>
  );
};
