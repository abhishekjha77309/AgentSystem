import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, ShieldAlert, Zap, Globe, 
  Cpu, HardDrive, Network, AlertTriangle, CheckCircle2,
  Search, RefreshCw, ShieldCheck, AlertCircle, CheckCircle
} from 'lucide-react';
import { useIdeStore } from '../store/ideStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { systemDiagnostics, TestResult } from '../services/systemDiagnostics';

export function HealthDashboard() {
  const { logs, network, tasks, isUiHealed, runtimeFixes } = useIdeStore();
  const [metrics, setMetrics] = useState<{ time: string, load: number, mesh: number }[]>([]);
  const [diagResults, setDiagResults] = useState<TestResult[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [fixMsg, setFixMsg] = useState("");

  useEffect(() => {
    const generateMetrics = () => {
      const now = new Date();
      const time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
      setMetrics(prev => [...prev.slice(-19), { 
        time, 
        load: Math.floor(Math.random() * 40) + 20,
        mesh: Math.floor(Math.random() * 100)
      }]);
    };

    const interval = setInterval(generateMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const runTests = async () => {
    setIsDiagnosing(true);
    setFixMsg("");
    const results = await systemDiagnostics.runFullSuite();
    setDiagResults(results);
    setIsDiagnosing(false);
  };

  const handleFix = async () => {
    const failures = diagResults.filter(r => !r.success);
    const msg = await systemDiagnostics.fixLifecycle(failures);
    setFixMsg(msg);
    await runTests();
  };

  const errorCount = logs.filter(l => l.level === 'error').length;

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-6 space-y-6 overflow-y-auto font-sans text-neutral-100 custom-scrollbar">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400 uppercase tracking-tight">
              <Zap className="w-6 h-6 fill-current" /> System Health Nexus
           </h2>
           <p className="text-xs text-neutral-500 font-mono">Autonomous heartbeat and functional mesh diagnostics</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             onClick={runTests} 
             disabled={isDiagnosing}
             size="sm"
             className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4"
           >
              {isDiagnosing ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <ShieldCheck className="w-3 h-3 mr-2" />}
              {isDiagnosing ? 'Analyzing...' : 'Run Diagnostics'}
           </Button>
           <div className={`px-4 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold uppercase transition-all ${isUiHealed ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400' : 'bg-indigo-950/20 border-indigo-500/50 text-indigo-400'}`}>
              <ShieldAlert className="w-4 h-4" /> 
              {isUiHealed ? 'UI Stabilized' : 'Mesh Active'}
           </div>
        </div>
      </div>

      {fixMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {fixMsg}
        </div>
      )}

      {diagResults.length > 0 && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
            {diagResults.map(res => (
              <div key={res.functionId} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-3 transition-all">
                 <div className={`p-1.5 rounded-lg ${res.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                   {res.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-neutral-200 truncate">{res.name}</div>
                    <div className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono truncate">{res.functionId}</div>
                 </div>
              </div>
            ))}
            {diagResults.some(r => !r.success) && (
              <div className="md:col-span-2 lg:col-span-3 flex justify-center py-2">
                 <Button 
                   onClick={handleFix} 
                   size="sm"
                   variant="outline"
                   className="border-amber-700 text-amber-400 hover:bg-amber-900/40 hover:text-amber-300 text-[10px]"
                 >
                    <Zap className="w-3 h-3 mr-2" /> Trigger Autonomous Fix Lifecycle
                 </Button>
              </div>
            )}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
         {[
           { label: 'Mesh Latency', value: '14ms', icon: Globe, color: 'text-indigo-400' },
           { label: 'Agent Health', value: '98.4%', icon: Heart, color: 'text-emerald-400' },
           { label: 'Memory Pressure', value: '24%', icon: HardDrive, color: 'text-amber-400' },
           { label: 'Sync Status', value: 'Published', icon: Network, color: 'text-cyan-400' }
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

               {runtimeFixes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-800">
                     <div className="text-[10px] text-emerald-400 font-bold mb-2 flex items-center gap-2">
                        <Cpu className="w-3 h-3" /> AUTONOMOUS RECOVERY LOG
                     </div>
                     {runtimeFixes.map(fix => (
                        <div key={fix.id} className="p-2 bg-emerald-950/10 border border-emerald-900/20 text-emerald-300 rounded-lg text-[9px] mb-2">
                           <div className="font-bold mb-1 underline">Resolved: {fix.description}</div>
                           <div className="opacity-70">{fix.resolution}</div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
