
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tarea, Actividad } from '../../types/index';
import { getHistoricalDataByDiscipline } from '../reports/strategies/kpiEngine';
import { TrendingUp, Clock, Calendar, CheckSquare } from 'lucide-react';

interface HistoricosViewProps {
  tareas: Tarea[];
  actividades: Actividad[];
}

export const HistoricosView: React.FC<HistoricosViewProps> = ({ tareas, actividades }) => {
  
  const durationData = useMemo(() => getHistoricalDataByDiscipline(tareas, actividades, 'duration'), [tareas, actividades]);
  const dateData = useMemo(() => getHistoricalDataByDiscipline(tareas, actividades, 'date'), [tareas, actividades]);
  const dailyData = useMemo(() => getHistoricalDataByDiscipline(tareas, actividades, 'daily'), [tareas, actividades]);

  const CustomChart = ({ title, data, icon: Icon, color }: { title: string, data: any[], icon: any, color: string }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-[500px]">
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 ${color} bg-opacity-10 rounded-2xl flex items-center justify-center text-blue-600`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Porcentaje de Cumplimiento (%)</p>
        </div>
      </div>
      
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              domain={[0, 100]}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
            <Bar dataKey="Software" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="Control" fill="#d97706" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="Mecánica" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <div className="flex items-center gap-3 mb-2">
           <TrendingUp className="text-blue-600" size={32} />
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Análisis de Tendencias Históricas y YTD</h2>
        </div>
        <p className="text-slate-500 font-medium ml-11">Visualización del desempeño operativo acumulado por disciplina durante el año fiscal {new Date().getFullYear()}.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <CustomChart 
          title="Evolución: Cumplimiento en Duración" 
          data={durationData} 
          icon={Clock}
          color="bg-blue-600"
        />
        
        <CustomChart 
          title="Evolución: Cumplimiento en Fecha" 
          data={dateData} 
          icon={Calendar}
          color="bg-amber-600"
        />

        <CustomChart 
          title="Evolución: Cumplimiento Diario de Actividades" 
          data={dailyData} 
          icon={CheckSquare}
          color="bg-indigo-600"
        />
      </div>
      
      <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
          <TrendingUp size={20} />
        </div>
        <div>
           <h4 className="font-black text-blue-900 text-sm uppercase tracking-widest mb-1">Nota Metodológica</h4>
           <p className="text-xs text-blue-800 font-medium leading-relaxed">
             Los datos mensuales se basan en tareas y actividades cuya fecha de finalización real pertenece al periodo indicado. 
             La columna <strong>YTD (Year To Date)</strong> representa el promedio ponderado de cumplimiento desde el 1 de enero hasta el día de hoy, 
             proporcionando una visión consolidada del rendimiento anual por disciplina.
           </p>
        </div>
      </div>
    </div>
  );
};