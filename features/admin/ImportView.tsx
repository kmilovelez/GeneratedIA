
import React from 'react';
import { Upload } from 'lucide-react';

export const ImportView = () => (
  <div className="p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4 shadow-inner max-w-2xl mx-auto">
    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm"><Upload size={32} /></div>
    <h3 className="text-xl font-bold text-slate-800">Importación de Datos</h3>
    <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Arrastre su archivo Excel (.xlsx) para cargar masivamente Líneas de Negocio, Proyectos, Tareas y Actividades.</p>
    <div className="pt-6">
      <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition">Seleccionar Archivo</button>
    </div>
  </div>
);
