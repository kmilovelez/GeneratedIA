
import React from 'react';
import { Download, FileSpreadsheet, X } from 'lucide-react';

interface PreviewModalProps {
  title: string;
  data: any[];
  isGenerating: boolean;
  onClose: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ 
  title, data, isGenerating, onClose, onExportPdf, onExportExcel 
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h4 className="font-bold uppercase tracking-wider text-slate-800">{title}</h4>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition"><X size={24} /></button>
        </div>
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          {data.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {Object.keys(data[0]).map(k => (
                    <th key={k} className="px-4 py-3 text-[10px] font-black uppercase border-b text-slate-500 tracking-tighter">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="px-4 py-3 text-sm text-slate-600">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center py-20 text-slate-400 italic">No hay datos disponibles para previsualizar con los filtros actuales.</p>
          )}
        </div>
        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition">Cerrar</button>
          <button 
            disabled={isGenerating || data.length === 0} 
            onClick={onExportPdf} 
            className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
             <Download size={16} /> Generar PDF
          </button>
          <button 
            disabled={isGenerating || data.length === 0} 
            onClick={onExportExcel} 
            className="px-6 py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
          >
             <FileSpreadsheet size={16} /> Generar Excel
          </button>
        </div>
      </div>
    </div>
  );
};
