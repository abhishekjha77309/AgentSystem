import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdeStore } from '../store/ideStore';

export const TerminalPanel: React.FC = () => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<{ cmd: string; out: string; err: string; code: number }[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const addLog = useIdeStore(s => s.addLog);

    const executeCommand = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!command.trim() || loading) return;

        const cmdToRun = command;
        setCommand('');
        setCommandHistory(prev => [cmdToRun, ...prev].slice(0, 50));
        setHistoryIndex(-1);
        setLoading(true);

        try {
            const res = await fetch('/api/terminal/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmdToRun })
            });
            const data = await res.json();
            
            setHistory(prev => [...prev, { 
                cmd: cmdToRun, 
                out: data.stdout, 
                err: data.stderr, 
                code: data.exitCode 
            }]);

            if (data.exitCode !== 0) {
                addLog(`Terminal Command Failed: ${cmdToRun}`, 'system', 'error');
            } else {
                addLog(`Terminal Command Success: ${cmdToRun}`, 'system', 'success');
            }
        } catch (err) {
            setHistory(prev => [...prev, { cmd: cmdToRun, out: '', err: 'Execution Error', code: -1 }]);
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCommand('');
            }
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className="flex flex-col h-full bg-black text-emerald-400 font-mono text-[11px] selection:bg-emerald-500/30">
            <div className="flex items-center justify-between p-2 border-b border-neutral-900 bg-neutral-950">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-[9px] uppercase font-black tracking-tighter text-neutral-500">Antigravity_Bash_v1.0</span>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-neutral-900 hover:text-red-400" onClick={() => setHistory([])} title="Clear Terminal">
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            <div 
                ref={scrollRef} 
                className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar"
                onClick={() => inputRef.current?.focus()}
            >
                {history.length === 0 && (
                    <div className="text-neutral-700">
                        <div className="text-emerald-900">Antigravity local processing runtime v1.0.42-stable</div>
                        <div className="text-neutral-800">Ready for orchestration...</div>
                    </div>
                )}
                {history.map((entry, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-600 font-bold">ais@local:~$</span>
                            <span className="text-white">{entry.cmd}</span>
                        </div>
                        {entry.out && <div className="text-neutral-300 whitespace-pre-wrap pl-4 leading-relaxed font-light">{entry.out}</div>}
                        {entry.err && <div className="text-red-500 whitespace-pre-wrap pl-4 border-l border-red-900/40">{entry.err}</div>}
                    </div>
                ))}
                {loading && <div className="flex items-center gap-2 text-emerald-600/50"><div className="w-2 h-2 bg-emerald-600 animate-ping rounded-full" /> executing remote cell command...</div>}
            </div>

            <form onSubmit={executeCommand} className="p-2.5 bg-neutral-950 border-t border-neutral-900 flex items-center gap-2">
                <span className="text-emerald-500 font-bold opacity-70">ais@local:~$</span>
                <input 
                    ref={inputRef}
                    value={command}
                    onChange={e => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder=" "
                    className="flex-1 bg-transparent border-none outline-none text-emerald-100 placeholder:text-neutral-800 font-mono caret-emerald-500"
                    autoFocus
                />
            </form>
        </div>
    );
};
