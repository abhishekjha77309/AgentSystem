import React, { useState, useEffect } from 'react';
import { OrchestratorService, OrchestrationStep, CellExecution } from '../services/orchestrator';
import { 
  Network, Search, ListTodo, Boxes, Combine, Activity, 
  CheckCircle2, Loader2, AlertCircle, Cpu, ShieldCheck,
  Code, FileCode, Beaker, Zap, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdeStore } from '../store/ideStore';

export function OrchestratorMonitor() {
  const isLocalMode = useIdeStore(s => s.isLocalMode);
  const [orchestrator] = useState(() => new OrchestratorService());
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<OrchestrationStep[]>([]);
  const [executions, setExecutions] = useState<CellExecution[]>([]);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orchestrator.onUpdate = (s, e) => {
      setSteps(s);
      setExecutions(e);
    };
  }, [orchestrator]);

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    setFinalResult(null);
    setError(null);
    try {
      const result = await orchestrator.runFullStack(prompt, isLocalMode);
      setFinalResult(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'research': return <Search className="w-4 h-4" />;
      case 'chunking': return <ListTodo className="w-4 h-4" />;
      case 'cell_creation': return <Boxes className="w-4 h-4" />;
      case 'network_injection': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'execution': return <Network className="w-4 h-4" />;
      case 'synthesis': return <Combine className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100 p-6 space-y-6 overflow-y-auto font-sans">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
            <Cpu className="w-6 h-6" /> Deep Orchestrator Panel
          </h2>
          <p className="text-sm text-neutral-500">Intelligent Cell Creation & Context Synthesis (OpenClaw + LiteLLM)</p>
        </div>
        <div className="flex items-center gap-4">
           {isRunning && (
             <div className="flex items-center gap-2 text-xs bg-indigo-950/30 border border-indigo-900/50 px-3 py-1 rounded-full text-indigo-400 animate-pulse">
                <ShieldCheck className="w-3 h-3" /> Watcher Cells Active (Integrity Locked)
             </div>
           )}
           <div className="text-xs font-mono text-neutral-600 bg-neutral-900 px-3 py-1 rounded-full">
              LATENCY: 42ms | REGION: GLOBAL
           </div>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 space-y-4 shrink-0 shadow-lg">
        <textarea 
          placeholder="Describe a complex project requiring multiple agents and deep research..."
          className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-neutral-700"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isRunning}
        />
        <div className="flex items-center justify-between">
           <div className="flex gap-2 text-[10px] text-neutral-500 uppercase font-mono">
              <span>Framework Auto-Select: ON</span>
              <span>-</span>
              <span>Context Compression: ON</span>
           </div>
           <Button 
             onClick={handleStart} 
             disabled={isRunning || !prompt.trim()} 
             className="bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all px-8"
           >
             {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
             Initiate Deep Orchestration
           </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2 duration-300">
           <AlertCircle className="w-5 h-5 shrink-0" />
           <div className="text-sm">
              <div className="font-bold">Orchestration Aborted</div>
              <div className="opacity-80">{error}</div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Step Progress */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Orchestration Phase</h3>
          <div className="space-y-2">
            {steps.length === 0 ? (
               <div className="p-8 border border-dashed border-neutral-800 rounded-xl text-center text-neutral-600 italic text-xs">
                  Awaiting initialization...
               </div>
            ) : steps.map((step) => (
              <div key={step.id} className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                step.status === 'completed' ? 'bg-indigo-950/10 border-indigo-900/30 text-indigo-300' :
                step.status === 'running' ? 'bg-neutral-900 border-indigo-500/30 text-white animate-in fade-in-50' :
                'bg-neutral-900/30 border-neutral-800 text-neutral-600'
              }`}>
                <div className={`${step.status === 'running' ? 'animate-pulse text-indigo-400' : ''}`}>
                  {getStepIcon(step.type)}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold capitalize">{step.type.replace('_', ' ')}</div>
                  <div className="text-[10px] opacity-70 truncate">{step.details}</div>
                </div>
                {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {step.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Parallel Cells */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center justify-between px-1">
             <span>Cell Execution Queue (Parallelized)</span>
             <span className="font-mono text-[9px] lowercase opacity-50 tracking-normal italic">Self-Evolving standalone units</span>
          </h3>
          <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl overflow-y-auto p-4 custom-scrollbar">
            {executions.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-neutral-700 space-y-3">
                  <Boxes className="w-12 h-12 opacity-10" />
                  <p className="text-xs italic">Cells will be dynamically allocated after Phase 1 & 2</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {executions.map(exec => (
                  <div key={exec.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2 relative overflow-hidden group hover:border-indigo-900/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          exec.status === 'completed' ? 'bg-emerald-500' : 
                          exec.status === 'running' ? 'bg-indigo-400 animate-pulse' : 
                          exec.status === 'injecting' ? 'bg-amber-400 animate-bounce' :
                          'bg-neutral-700'
                        }`} />
                        <span className="text-[10px] font-mono text-neutral-400">ID: {exec.id.slice(0, 6)}</span>
                      </div>
                      <span className="text-[9px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 font-bold uppercase tracking-tighter">
                         {exec.config.framework}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-neutral-200 line-clamp-2 min-h-[2rem]">
                      {exec.task}
                    </div>
                    
                    {exec.memorySnapshot && (
                      <div className="text-[9px] p-2 bg-black/40 rounded border border-indigo-900/20 text-indigo-300 italic line-clamp-2">
                        <div className="flex items-center gap-1 mb-1 opacity-50 font-bold uppercase tracking-widest text-[8px]">
                          <Database className="w-2 h-2" /> Inherited Context
                        </div>
                        {exec.memorySnapshot}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
                      <div className="flex gap-1">
                         {exec.config.mcpServers.map(mcp => (
                           <span key={mcp} className="text-[8px] bg-indigo-900/20 text-indigo-400/70 border border-indigo-900/30 px-1 rounded uppercase">{mcp}</span>
                         ))}
                      </div>
                    </div>
                    {exec.result && (
                       <div className="mt-2 text-[9px] text-emerald-400/70 font-mono italic flex items-center gap-1">
                          <CheckCircle2 className="w-2 h-2" /> Context Captured
                       </div>
                    )}
                    {exec.status === 'running' && (
                       <div className="absolute top-0 right-0 p-1">
                          <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Synthesis Result */}
      {finalResult && (
        <div className="bg-indigo-950/10 border border-indigo-900/40 rounded-xl p-6 mt-6 animate-in slide-in-from-bottom-4 fade-in duration-500 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
           <div className="flex items-center gap-3 text-indigo-400 font-bold mb-4 uppercase tracking-[0.2em] text-sm">
              <Combine className="w-5 h-5" /> Orchestrated Synthesis Outcome
           </div>
           
           <div className="prose prose-invert prose-xs max-w-none text-neutral-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap pl-2">
              {finalResult}
           </div>

           <div className="mt-6 flex gap-3 flex-wrap border-t border-indigo-900/20 pt-4">
              <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 cursor-pointer hover:bg-neutral-800 transition-colors">
                 <Code className="w-3.5 h-3.5" /> View Generated React Artifact
              </div>
              <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 cursor-pointer hover:bg-neutral-800 transition-colors">
                 <FileCode className="w-3.5 h-3.5 text-amber-500" /> Python Execution Logs
              </div>
              <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 cursor-pointer hover:bg-neutral-800 transition-colors">
                 <Beaker className="w-3.5 h-3.5 text-indigo-400" /> Deploy to LiteLLM Edge
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
