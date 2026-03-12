
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
        <div className="flex-1 bg-white px-8 py-6 min-h-0">
          {data.length > 0 ? (
            <div className="max-h-[52vh] overflow-auto rounded-2xl border border-slate-100 bg-white">
              <div className="min-w-max">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr>
                      {Object.keys(data[0]).map(k => (
                        <th
                          key={k}
                          className="sticky top-0 z-10 bg-slate-50 px-4 py-4 text-[10px] font-black uppercase border-b border-slate-200 text-slate-500 tracking-[0.08em]"
                        >
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        {Object.values(row).map((v: any, j) => (
                          <td key={j} className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600 align-top">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
