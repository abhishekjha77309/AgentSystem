import React, { useState } from 'react';
import { useIdeStore } from '../store/ideStore';
import { Calendar, ListTodo, Plus, Trash, Play, Activity, Link as LinkIcon, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function TaskScheduler() {
    const tasks = useIdeStore(s => s.tasks);
    const addTask = useIdeStore(s => s.addTask);
    const updateTask = useIdeStore(s => s.updateTask);
    const addLog = useIdeStore(s => s.addLog);
    const globalTaskContext = useIdeStore(s => s.globalTaskContext);
    const setGlobalTaskContext = useIdeStore(s => s.setGlobalTaskContext);
    
    const [newTaskPrompt, setNewTaskPrompt] = useState('');
    const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
    const [cron, setCron] = useState('');
    const [linkedTaskId, setLinkedTaskId] = useState<string>('');
    const [showGlobalContext, setShowGlobalContext] = useState(false);

    const handleAddTask = () => {
        if (!newTaskPrompt.trim()) return;
        addTask({
            prompt: newTaskPrompt,
            priority,
            isRecurring: !!cron,
            cron: cron || undefined,
            linkedTaskId: linkedTaskId || undefined,
        });
        addLog(`[Brain] Scheduled new background task: "${newTaskPrompt}" (Priority: ${priority})`, 'orchestrator');
        setNewTaskPrompt('');
        setCron('');
        setLinkedTaskId('');
    };

    return (
        <div className="w-full h-full flex flex-col bg-neutral-950 p-4 border rounded-xl border-indigo-900/50 shadow-lg font-sans text-neutral-100">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold tracking-wide">
                    <ListTodo className="w-5 h-5" /> Orchestrator Task Scheduler
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-8 text-xs ${showGlobalContext ? 'text-indigo-400 bg-indigo-900/20' : 'text-neutral-500 hover:text-indigo-300'}`}
                        onClick={() => setShowGlobalContext(!showGlobalContext)}
                    >
                        <Share2 className="w-4 h-4 mr-2" /> Global Context
                    </Button>
                    <div className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full">
                        {tasks.length} Active Process(es)
                    </div>
                </div>
            </div>

            {showGlobalContext && (
                <div className="mb-6 p-4 bg-indigo-900/10 border border-indigo-900/30 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-indigo-400 uppercase font-bold tracking-widest flex items-center gap-2">
                            <Share2 className="w-3 h-3" /> Shared Knowledge Base (Global Context)
                        </Label>
                        <span className="text-[10px] text-neutral-500 font-mono italic">Shared across all orchestrated tasks</span>
                    </div>
                    <Textarea 
                        value={globalTaskContext}
                        onChange={(e) => setGlobalTaskContext(e.target.value)}
                        placeholder="Define context accessible by all tasks (e.g. project goals, constraints, global variables)..."
                        className="bg-neutral-950 border-neutral-800 min-h-[80px] text-sm font-mono text-neutral-300 focus:ring-indigo-500"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 shrink-0">
                <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label className="text-xs text-neutral-400 uppercase font-semibold">Intent Definition</Label>
                    <Input 
                        value={newTaskPrompt} onChange={e => setNewTaskPrompt(e.target.value)}
                        placeholder="e.g. Scrape new logs and synthesize hourly..."
                        className="bg-neutral-900 border-neutral-700" 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-neutral-400 uppercase font-semibold text-nowrap">Link Context From</Label>
                    <select 
                        className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" 
                        value={linkedTaskId} 
                        onChange={e => setLinkedTaskId(e.target.value)}
                    >
                        <option value="">None (Isolated)</option>
                        {tasks.map(t => (
                            <option key={t.id} value={t.id}>{t.prompt.substring(0, 20)}...</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-neutral-400 uppercase font-semibold">Priority</Label>
                    <select className="flex h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" value={priority} onChange={e => setPriority(e.target.value as any)}>
                        <option value="low">Low (Background)</option>
                        <option value="medium">Medium</option>
                        <option value="high">High (Immediate)</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-neutral-400 uppercase font-semibold text-nowrap">Schedule</Label>
                    <div className="flex gap-2">
                        <Input 
                            value={cron} onChange={e => setCron(e.target.value)}
                            placeholder="*/15 * * * *" className="bg-neutral-900 border-neutral-700 font-mono text-xs" 
                        />
                        <Button onClick={handleAddTask} className="bg-indigo-600 hover:bg-indigo-500 shadow-md whitespace-nowrap"><Plus className="w-4 h-4 mr-1" /> Deploy</Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {tasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-neutral-500 font-mono text-xs text-center p-6 border border-dashed border-neutral-800 rounded-xl">
                        No active background tasks scheduled.<br/>Add intents above to deploy continuous cell routines.
                    </div>
                ) : tasks.map(t => (
                    <div key={t.id} className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${t.status === 'working' ? 'bg-cyan-400 animate-pulse' : t.status === 'completed' ? 'bg-emerald-500' : t.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                    <span className={`font-medium text-sm ${t.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-200'}`}>{t.prompt}</span>
                                </div>
                                <div className="flex gap-2 text-xs text-neutral-500 font-mono items-center">
                                    <span>ID: {t.id.slice(0, 8)}</span>
                                    <span className="text-neutral-700">|</span>
                                    <span className={`${t.priority === 'high' ? 'text-rose-400' : ''}`}>Pri: {t.priority.toUpperCase()}</span>
                                    {t.isRecurring && (
                                        <>
                                            <span className="text-neutral-700">|</span>
                                            <span className="flex items-center text-indigo-400"><Calendar className="w-3 h-3 mr-1" /> {t.cron}</span>
                                        </>
                                    )}
                                    {t.linkedTaskId && (
                                        <>
                                            <span className="text-neutral-700">|</span>
                                            <span className="flex items-center text-amber-400 bg-amber-900/20 px-1 rounded border border-amber-900/50">
                                                <LinkIcon className="w-3 h-3 mr-1" /> Linked: {t.linkedTaskId.slice(0, 8)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {t.status === 'pending' && (
                                    <Button size="sm" variant="outline" className="h-7 border-emerald-900 text-emerald-400 hover:bg-emerald-900" onClick={async () => {
                                        updateTask(t.id, { status: 'working' });
                                        useIdeStore.getState().addLog(`[Cell] Task ${t.id.slice(0,8)} claimed by Local Node. Processing...`, 'cell');
                                        
                                        try {
                                             await fetch('/api/tasks/sync', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ prompt: t.prompt, priority: t.priority, isRecurring: t.isRecurring, cron: t.cron })
                                             });
                                        } catch (e) {
                                             // Network failure
                                        }

                                        // Connect explicitly to backend for Memory Sharing
                                        setTimeout(async () => {
                                            useIdeStore.getState().addLog(`[Cell] Task ${t.id.slice(0,8)} extracting isolated sub-context...`, 'cell');
                                            useIdeStore.getState().shareContext(t.id, 'Discovered relevant patterns in local scope.', 'Step 1: Cell Extraction');
                                            await fetch('/api/bloodstream/context', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ taskId: t.id, step: 'Extraction', context: 'Local Patterns' })
                                            }).catch(() => {});
                                        }, 1500);
                                        setTimeout(async () => {
                                            useIdeStore.getState().addLog(`[Bloodstream] Task ${t.id.slice(0,8)} propagated mid-results to global context`, 'bloodstream');
                                            useIdeStore.getState().shareContext(t.id, 'Analyzed semantic relationships via cross-cell collaboration.', 'Step 2: Bloodstream Share');
                                            await fetch('/api/bloodstream/context', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ taskId: t.id, step: 'Bloodstream Sync', context: 'Semantic Data' })
                                            }).catch(() => {});
                                        }, 3500);
                                        setTimeout(() => {
                                            useIdeStore.getState().addLog(`[Cell] Task ${t.id.slice(0,8)} execution complete. Data merged to main OpenAgents loop.`, 'cell', 'success');
                                            updateTask(t.id, { status: 'completed' });
                                        }, 6000);
                                    }}><Play className="w-3 h-3 mr-1" /> Run Now</Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-500 hover:text-red-400" onClick={() => updateTask(t.id, { status: 'failed' })}><Trash className="w-3 h-3" /></Button>
                            </div>
                        </div>

                        {/* Rendering Context Collaboration sharing UI */}
                        {(t.intermediateSteps?.length || t.context || t.linkedTaskId || globalTaskContext) && (
                           <div className="mt-2 bg-neutral-950 border border-indigo-900/40 rounded p-3 font-mono text-[11px] text-neutral-400">
                                <div className="text-indigo-400 font-semibold mb-2 flex items-center justify-between uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><Activity className="w-3 h-3"/> Task Memory & Context</div>
                                    {t.linkedTaskId && <span className="text-[9px] text-amber-500/70 lowercase tracking-normal">Inheriting parent stream {t.linkedTaskId.slice(0,8)}</span>}
                                </div>
                                
                                {globalTaskContext && (
                                    <div className="mb-2 p-1.5 bg-indigo-900/10 border-l border-indigo-500/50 text-[10px]">
                                        <div className="text-indigo-300/60 mb-1 flex items-center gap-1"><Share2 className="w-2.5 h-2.5"/> Global Knowledge:</div>
                                        <div className="text-neutral-500 italic truncate">{globalTaskContext}</div>
                                    </div>
                                )}

                               {t.intermediateSteps && t.intermediateSteps.length > 0 && (
                                   <div className="flex gap-2 flex-wrap mb-2">
                                       {t.intermediateSteps.map((step, idx) => (
                                          <span key={idx} className="bg-indigo-900/30 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded shadow-sm">{step}</span>
                                       ))}
                                   </div>
                               )}
                               {t.context && (
                                   <div className="text-neutral-500 whitespace-pre-wrap pl-2 border-l border-neutral-800">{t.context}</div>
                               )}
                               {t.linkedTaskId && !t.context && (
                                   <div className="text-neutral-600 italic">Awaiting upstream data propagation from parent task...</div>
                               )}
                           </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
