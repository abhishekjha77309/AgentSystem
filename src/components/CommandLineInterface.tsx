import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronRight, Loader2, Cpu, Globe, Zap } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useIdeStore } from '../store/ideStore';

export function CommandLineInterface() {
  const isLocalMode = useIdeStore(s => s.isLocalMode);
  const setLocalMode = useIdeStore(s => s.setLocalMode);
  
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ type: 'in' | 'out', text: string, isStream?: boolean }[]>([
    { type: 'out', text: 'Antigravity IDE Logic Node v2.0-Alpha' },
    { type: 'out', text: 'Connected to local mesh: mesh-node-8a39' },
    { type: 'out', text: 'Type "help" for a list of available AI unit commands.' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io();
    const socket = socketRef.current;

    socket.on('cli-output', (output: string) => {
      setHistory(prev => {
         const lastIndex = prev.length - 1;
         const lastItem = prev[lastIndex];
         
         // If the last item was output from the current stream, append to it nicely
         if (lastItem && lastItem.type === 'out' && lastItem.isStream) {
            const updatedHistory = [...prev];
            updatedHistory[lastIndex] = { 
               ...lastItem, 
               text: lastItem.text + output 
            };
            return updatedHistory;
         }
         
         // Otherwise start a new output stream block
         return [...prev, { type: 'out', text: output, isStream: true }];
      });
    });

    socket.on('cli-finished', () => {
       setHistory(prev => {
         const lastIndex = prev.length - 1;
         const lastItem = prev[lastIndex];
         if (lastItem && lastItem.type === 'out' && lastItem.isStream) {
            const updatedHistory = [...prev];
            updatedHistory[lastIndex] = { ...lastItem, isStream: false };
            return updatedHistory;
         }
         return prev;
       });
       setIsProcessing(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'in', text: cmd }]);
    setInput('');
    setIsProcessing(true);

    if (cmd === 'clear') {
      setHistory([]);
      setIsProcessing(false);
      return;
    }

    if (cmd === 'help') {
       setHistory(prev => [...prev, { type: 'out', text: 'COMMANDS:\n- list-cells: Shows all active agent units\n- inspect <id>: Detailed telemetry for a cell\n- deploy-mesh: Publish local learnings to openagents.org\n- sync: Synchronize with network peers\n- self-fix: Run autonomous diagnostic & repair protocol' }]);
       setIsProcessing(false);
       return;
    }

    socketRef.current?.emit('cli-command', cmd);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden font-mono text-sm shadow-2xl">
      <div className="bg-neutral-900 px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-bold tracking-tight uppercase">IDE Node Terminal</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLocalMode(!isLocalMode)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight transition-all border ${
              isLocalMode 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
            }`}
          >
            {isLocalMode ? <Zap className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {isLocalMode ? '100% Local Mode' : 'Cloud Sync Active'}
          </button>
          
          <div className="flex gap-1">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
             <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-2 custom-scrollbar text-neutral-400"
      >
        {history.map((line, i) => (
          <div key={i} className={`flex gap-2 ${line.type === 'in' ? 'text-indigo-300' : 'text-emerald-400/80'}`}>
            <span className="shrink-0 opacity-50">{line.type === 'in' ? '>' : '#'}</span>
            <pre className="whitespace-pre-wrap">{line.text}</pre>
          </div>
        ))}
        {isProcessing && (
           <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px]">Processing logic...</span>
           </div>
        )}
      </div>

      <form 
        onSubmit={handleCommand}
        className="bg-neutral-900/50 p-3 border-t border-neutral-800 flex items-center gap-3"
      >
        <ChevronRight className="w-4 h-4 text-neutral-600" />
        <input 
          autoFocus
          className="bg-transparent border-none outline-none flex-1 text-indigo-200 placeholder:text-neutral-700"
          placeholder="Enter agent command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex items-center gap-2 text-[9px] text-neutral-600 uppercase font-bold tracking-widest px-2 py-1 bg-neutral-900 border border-neutral-800 rounded">
           <Cpu className="w-3 h-3" /> Node: Primary
        </div>
      </form>
    </div>
  );
}
