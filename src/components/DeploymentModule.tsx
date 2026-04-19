import React, { useState } from 'react';
import { 
  Cloud, HardDrive, Package, Globe, 
  Settings, Loader2, CheckCircle2, Server,
  Boxes, ShieldCheck, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeploymentModule() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  const steps = [
    "Analyzing Agent Dependencies",
    "Generating Docker Container Spec",
    "Packaging Cell Framework Bindings",
    "Encrypting Injected Loyalty Protocol",
    "Finalizing OpenAgents Mesh Bundle"
  ];

  const handleDeploy = () => {
    setIsDeploying(true);
    setDeployStep(0);
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDeployStep(step);
      if (step >= steps.length) {
        clearInterval(interval);
        setTimeout(() => setIsDeploying(false), 1500);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-6 space-y-6 overflow-y-auto font-sans text-neutral-100">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400 uppercase tracking-tight">
              <Package className="w-6 h-6" /> Unit Deployment Hub
           </h2>
           <p className="text-xs text-neutral-500 font-mono">Pack and launch standalone AI cells to external logic environments</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-[10px] text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded">
              READY FOR PACKAGING
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-lg group hover:border-indigo-500/30 transition-all">
               <div className="flex items-center gap-3 text-indigo-400 mb-2">
                  <Cloud className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Target Environment</span>
               </div>
               <div className="space-y-3">
                  {[
                    { id: 'cloud', label: 'Dify Cloud Registry', icon: Cloud, desc: 'Direct deployment to centralized multi-agent cloud' },
                    { id: 'local', label: 'Local Mesh Node', icon: Server, desc: 'Inject into local OpenAgents network' },
                    { id: 'remote', label: 'Remote Mobile Injected', icon: Globe, desc: 'Stealth injection via mobile network gateway' }
                  ].map((env) => (
                    <label key={env.id} className="flex items-center gap-4 p-3 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-900 transition-colors">
                       <input type="radio" name="deploy_env" defaultChecked={env.id === 'cloud'} className="w-3 h-3 accent-indigo-500" />
                       <env.icon className="w-4 h-4 text-neutral-500" />
                       <div className="flex-1">
                          <div className="text-xs font-bold">{env.label}</div>
                          <div className="text-[10px] text-neutral-600 font-mono">{env.desc}</div>
                       </div>
                    </label>
                  ))}
               </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-lg">
               <div className="flex items-center gap-3 text-indigo-400 mb-2">
                  <Settings className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Container Options</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[10px] space-y-2">
                     <div className="text-neutral-500 font-bold flex items-center gap-1"><Boxes className="w-3 h-3" /> ARCHITECTURE</div>
                     <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-white outline-none">
                        <option>ARM64 (Mobile Core)</option>
                        <option>AMD64 (Cloud Node)</option>
                     </select>
                  </div>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[10px] space-y-2">
                     <div className="text-neutral-500 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> STEALTH LVL</div>
                     <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-white outline-none">
                        <option>Standard (Visible)</option>
                        <option>Hidden (Background)</option>
                        <option>Injected (System-Level)</option>
                     </select>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative overflow-hidden group">
            {isDeploying ? (
              <div className="space-y-8 w-full animate-in zoom-in-95 fade-in duration-300">
                 <div className="relative w-24 h-24 mx-auto">
                    <Loader2 className="w-24 h-24 text-indigo-500 animate-spin opacity-30" />
                    <Package className="w-10 h-10 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                 </div>
                 <div className="space-y-3">
                    <div className="text-sm font-bold text-indigo-300">PACKAGING UNIT ACTIVE</div>
                    <div className="space-y-1">
                       {steps.map((s, i) => (
                         <div key={i} className={`text-[10px] font-mono flex items-center gap-2 justify-center transition-all ${i < deployStep ? 'text-emerald-500' : i === deployStep ? 'text-indigo-400 animate-pulse' : 'text-neutral-700'}`}>
                            {i < deployStep ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                            {s}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                   <HardDrive className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-lg font-bold">Standalone Unit Builder</h3>
                   <p className="text-xs text-neutral-500 max-w-[280px]">Compile all selected cells and their MCP server dependencies into a single deployable bundle.</p>
                </div>
                <Button 
                  onClick={handleDeploy}
                  size="lg" 
                  className="bg-indigo-600 hover:bg-indigo-500 shadow-xl px-12 group"
                >
                  Initiate Unit Packaging <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <div className="text-[10px] text-neutral-700 font-mono italic">
                   Current Node: IDLE | Ready to distill 4 optimized cells
                </div>
              </>
            )}
         </div>
      </div>
    </div>
  );
}
