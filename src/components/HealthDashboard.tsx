import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, ShieldAlert, Zap, Globe, 
  Cpu, HardDrive, Network, AlertTriangle, CheckCircle2,
  RefreshCw, ShieldCheck
} from 'lucide-react';
import { useIdeStore } from '../store/ideStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function HealthDashboard() {
  const { logs, activeCells } = useIdeStore();
  const [metrics, setMetrics] = useState<{ time: string, load: number, mesh: number }[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const now = new Date();
        const time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
        
        setMetrics(prev => [...prev.slice(-19), { 
          time, 
          load: data.metrics.load,
          mesh: data.metrics.mesh
        }]);
      } catch (e) {
        console.error("Failed to fetch node metrics", e);
      }
    };

    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const errorCount = logs.filter(l => l.level === 'error').length;

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-6 space-y-6 overflow-y-auto font-sans text-neutral-100 custom-scrollbar">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400 uppercase tracking-tight">
              <Zap className="w-6 h-6 fill-current" /> System Health
           </h2>
           <p className="text-xs text-neutral-500 font-mono">Real-time resource load and node metrics</p>
        </div>
        <div className="flex items-center gap-3">
           <div className={`px-4 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold uppercase transition-all bg-indigo-950/20 border-indigo-500/50 text-indigo-400`}>
              <ShieldAlert className="w-4 h-4" /> 
              Environment Active
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
         {[
           { label: 'Uptime', value: 'Active', icon: Globe, color: 'text-indigo-400' },
           { label: 'Agents Active', value: activeCells.length.toString(), icon: Heart, color: 'text-emerald-400' },
           { label: 'Memory Pressure', value: '24%', icon: HardDrive, color: 'text-amber-400' },
           { label: 'Environment', value: 'Production', icon: Network, color: 'text-cyan-400' }
         ].map((stat, i) => (
           <div key={i} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-lg">
              <div>
                 <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">{stat.label}</div>
                 <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
              <stat.icon className={`w-8 h-8 opacity-20 group-hover:opacity-60 transition-opacity ${stat.color}`} />
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
         <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
               <Activity className="w-4 h-4" /> Logic Node Resource Load
            </h3>
            <div className="flex-1 min-h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                     <defs>
                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                     <XAxis dataKey="time" hide />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', fontSize: '10px' }}
                        itemStyle={{ color: '#818cf8' }}
                     />
                     <Area type="monotone" dataKey="load" stroke="#6366f1" fillOpacity={1} fill="url(#colorLoad)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
               <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Error Log Correlation
               </h3>
               <span className="text-[10px] bg-red-950/40 text-red-400 px-2 py-0.5 rounded border border-red-900/30">
                  {errorCount} TOTAL ERRORS
               </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar font-mono text-[10px]">
               {logs.filter(l => l.level === 'error').length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600 italic">
                     <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                     No anomalies detected in current cycle.
                  </div>
               ) : (
                  logs.filter(l => l.level === 'error').map(l => (
                     <div key={l.id} className="p-2 bg-red-950/10 border border-red-900/20 text-red-300 rounded flex gap-3">
                        <span className="opacity-50 shrink-0">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                        <span className="flex-1">{l.message}</span>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
