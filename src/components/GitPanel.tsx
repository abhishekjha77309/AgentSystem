import React, { useState, useEffect } from 'react';
import { GitBranch, Search, Loader2, RefreshCw, Download, Scissors, Eye, FileText, CheckSquare, Square, FileDiff, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAI } from '../lib/gemini';

export const GitPanel: React.FC = () => {
    const [output, setOutput] = useState<string>('');
    const [statusLines, setStatusLines] = useState<string[]>([]);
    const [branches, setBranches] = useState<string[]>([]);
    const [currentBranch, setCurrentBranch] = useState<string>('');
    
    const [newBranch, setNewBranch] = useState('');
    const [commitMsg, setCommitMsg] = useState('');
    const [amend, setAmend] = useState(false);
    const [sign, setSign] = useState(false);
    
    const [selectedFileForDiff, setSelectedFileForDiff] = useState<string | null>(null);
    const [diffContent, setDiffContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const execGit = async (args: string, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/terminal/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: `git ${args}` })
            });
            const data = await res.json();
            const out = data.stdout || data.stderr || 'No output.';
            if (!silent) setOutput(out);
            return out;
        } catch (err: any) {
            if (!silent) setOutput(err.message || 'Execution error');
            return null;
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchGitState = async () => {
        setLoading(true);
        const statusOut = await execGit('status --short', true);
        if (statusOut) {
            const lines = statusOut.split('\n').filter(Boolean);
            setStatusLines(lines.length === 1 && lines[0] === 'No output.' ? [] : lines);
        }

        const branchesOut = await execGit('branch --list', true);
        if (branchesOut && branchesOut !== 'No output.') {
            const branchList = branchesOut.split('\n').filter(Boolean).map(b => b.trim());
            const curr = branchList.find(b => b.startsWith('*'))?.replace('*', '').trim() || '';
            const all = branchList.map(b => b.replace('*', '').trim());
            setBranches(all);
            setCurrentBranch(curr);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGitState();
    }, []);

    const handleStageAll = async () => {
        await execGit('add .');
        fetchGitState();
    };

    const handleCommit = async () => {
        if (!commitMsg && !amend) return;
        
        let cmd = `commit `;
        if (amend) cmd += `--amend `;
        if (sign) cmd += `-S `;
        
        if (commitMsg) {
            cmd += `-m "${commitMsg.replace(/"/g, '\\"')}"`;
        } else if (amend) {
            cmd += `--no-edit`;
        }

        await execGit(cmd);
        setCommitMsg('');
        setAmend(false);
        fetchGitState();
    };

    const handlePush = async () => {
        await execGit('push');
        fetchGitState();
    };

    const handlePull = async () => {
        await execGit('pull');
        fetchGitState();
    };

    const handleFetchPrune = async () => {
        await execGit('fetch --prune');
        fetchGitState();
    };

    const handleAutoCommitAgent = async () => {
        setLoading(true);
        try {
            // Get diff
            const diffOut = await execGit('diff', true);
            const stagedOut = await execGit('diff --cached', true);
            const statusOut = await execGit('status', true);
            const fullDiff = `STATUS:\n${statusOut}\n\nSTAGED:\n${stagedOut || ''}\n\nUNSTAGED:\n${diffOut || ''}`;

            if (!fullDiff.trim() || fullDiff === '\n') {
                setOutput('Agent Error: No changes detected to commit.');
                setLoading(false);
                return;
            }

            setOutput('Agent is analyzing changes and generating commit message...');
            
            // Ask Gemini to generate commit message
            const ai = getAI();
            const response = await ai.models.generateContent({
               model: 'gemini-3.1-flash-preview',
               contents: `Generate a concise, professional Git commit message based on the following diff and status. Only output the commit message string, nothing else. Do not use markdown blocks.\n\n${fullDiff}`
            });
            const generatedMsg = response.text?.trim().replace(/^["']|["']$/g, '');
            if (!generatedMsg) {
                throw new Error("Failed to generate message from AI.");
            }

            setOutput(`Generated message: "${generatedMsg}". Committing...`);
            
            await execGit('add .', true);
            await execGit(`commit -m "${generatedMsg.replace(/"/g, '\\"')}"`, true);
            
            setOutput(`Successful AI Auto Commit: ${generatedMsg}`);
            fetchGitState();
        } catch (e: any) {
            setOutput('Agent Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = async () => {
        if (!newBranch) return;
        await execGit(`checkout -b "${newBranch}"`);
        setNewBranch('');
        fetchGitState();
    };

    const handleSwitchBranch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const target = e.target.value;
        if (!target) return;
        await execGit(`checkout "${target}"`);
        fetchGitState();
    };

    const handleViewDiff = async (file: string) => {
        setSelectedFileForDiff(file);
        setDiffContent('Loading diff...');
        const diffOut = await execGit(`diff HEAD -- "${file}"`, true);
        if (!diffOut || diffOut === 'No output.') {
            const stagedOut = await execGit(`diff --cached -- "${file}"`, true);
            setDiffContent(stagedOut || 'No changes to display.');
        } else {
            setDiffContent(diffOut);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-950 text-neutral-300">
            {/* Top Toolbar */}
            <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 flex flex-wrap gap-3 items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-sm">Source Control</span>
                    </div>
                    {currentBranch && (
                        <div className="flex items-center gap-2 bg-neutral-950 px-2 py-1 rounded border border-neutral-800 text-xs">
                            <span className="text-neutral-500">Branch:</span>
                            <select 
                                value={currentBranch} 
                                onChange={handleSwitchBranch}
                                className="bg-transparent border-none text-emerald-400 outline-none font-mono font-bold cursor-pointer"
                            >
                                {branches.map(b => <option key={b} value={b} className="bg-neutral-900 text-white">{b}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchGitState} disabled={loading} className="bg-neutral-800 border-neutral-700 h-7 text-xs">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePull} disabled={loading} className="bg-neutral-800 border-neutral-700 h-7 text-xs">
                        <Download className="w-3 h-3 mr-1" /> Pull
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleFetchPrune} disabled={loading} className="bg-neutral-800 border-neutral-700 h-7 text-xs" title="Fetch and remote stale remote-tracking branches">
                        <Scissors className="w-3 h-3 mr-1" /> Fetch --prune
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side: Controls & Status */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 border-r border-neutral-800 custom-scrollbar">
                    
                    {/* Branch Creation */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">New Branch</h3>
                        <div className="flex gap-2">
                            <input 
                                value={newBranch}
                                onChange={e => setNewBranch(e.target.value)}
                                placeholder="Branch name..."
                                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <Button size="sm" onClick={handleCreateBranch} disabled={!newBranch || loading} className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white h-auto py-1">
                                Create
                            </Button>
                        </div>
                    </div>

                    {/* Commit Box */}
                    <div className="space-y-2 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Commit Changes</h3>
                            <Button 
                              onClick={handleAutoCommitAgent} 
                              disabled={loading} 
                              className="h-6 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold px-2 rounded-sm text-white flex items-center gap-1"
                            >
                               <Bot className="w-3 h-3" /> Auto Commit
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <textarea 
                                value={commitMsg}
                                onChange={e => setCommitMsg(e.target.value)}
                                placeholder="Commit message (optional if amending)..."
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[60px] custom-scrollbar"
                            />
                            
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer hover:text-white transition-colors">
                                        <input type="checkbox" checked={amend} onChange={e => setAmend(e.target.checked)} className="hidden" />
                                        {amend ? <CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> : <Square className="w-3.5 h-3.5" />}
                                        Amend Previous
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer hover:text-white transition-colors">
                                        <input type="checkbox" checked={sign} onChange={e => setSign(e.target.checked)} className="hidden" />
                                        {sign ? <CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> : <Square className="w-3.5 h-3.5" />}
                                        Sign (GPG)
                                    </label>
                                </div>
                                <Button size="sm" onClick={handleCommit} disabled={(!commitMsg && !amend) || loading} className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 py-0 px-4 text-xs font-bold">
                                    Commit
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Core Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleStageAll} disabled={loading} className="flex-1 bg-neutral-800 border-neutral-700 h-8 text-xs font-bold text-emerald-400 hover:text-emerald-300">
                            Stage All (add .)
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePush} disabled={loading} className="flex-1 bg-neutral-800 border-neutral-700 h-8 text-xs font-bold text-indigo-400 hover:text-indigo-300">
                            Push to Remote
                        </Button>
                    </div>

                    {/* Pending Changes List */}
                    <div className="space-y-2 flex-1">
                        <h3 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Pending Changes</h3>
                        {statusLines.length === 0 ? (
                            <div className="text-xs text-neutral-600 italic px-2 bg-neutral-900/30 p-2 rounded">Working tree clean</div>
                        ) : (
                            <div className="space-y-1">
                                {statusLines.map((line, i) => {
                                    const mode = line.substring(0, 2);
                                    const file = line.substring(3);
                                    const isSelected = selectedFileForDiff === file;
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => handleViewDiff(file)}
                                            className={`group flex items-center gap-2 text-xs font-mono p-1.5 rounded border cursor-pointer transition-colors ${
                                                isSelected ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800'
                                            }`}
                                        >
                                            <span className={`w-5 text-center font-bold ${
                                                mode.includes('M') ? 'text-amber-400' : 
                                                mode.includes('A') || mode.includes('?') ? 'text-emerald-400' : 
                                                mode.includes('D') ? 'text-red-400' : 'text-neutral-400'
                                            }`}>
                                                {mode}
                                            </span>
                                            <span className="truncate flex-1 text-neutral-300">{file}</span>
                                            <FileDiff className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-neutral-600 group-hover:text-neutral-400'}`} />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Diff & Output */}
                <div className="flex-1 overflow-hidden flex flex-col bg-neutral-950/50">
                    
                    {/* Diff Viewer Pane */}
                    {selectedFileForDiff && (
                        <div className="flex-1 flex flex-col border-b border-neutral-900 max-h-[50%]">
                            <div className="p-2 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center shrink-0">
                                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2 truncate">
                                    <Eye className="w-3 h-3" /> {selectedFileForDiff}
                                </span>
                                <button onClick={() => setSelectedFileForDiff(null)} className="text-neutral-500 hover:text-red-400">&times;</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-[11px] font-mono leading-tight whitespace-pre">
                                {diffContent.split('\n').map((line, i) => {
                                    let clr = 'text-neutral-400';
                                    if (line.startsWith('+')) clr = 'text-emerald-400 bg-emerald-950/30';
                                    else if (line.startsWith('-')) clr = 'text-red-400 bg-red-950/30';
                                    else if (line.startsWith('@@')) clr = 'text-indigo-400 bg-indigo-950/30';
                                    
                                    return (
                                        <div key={i} className={`px-2 py-0.5 ${clr}`}>
                                            {line}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Terminal Output Pane */}
                    <div className="flex-1 flex flex-col min-h-[150px]">
                        <h3 className="text-[10px] font-semibold uppercase text-neutral-600 tracking-wider flex items-center justify-between p-2 bg-neutral-900 shrink-0">
                            <span>Raw Console Output</span>
                            {loading && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
                        </h3>
                        <div className="flex-1 bg-black p-3 overflow-y-auto font-mono text-[10px] text-neutral-500 whitespace-pre-wrap custom-scrollbar">
                            {output || 'No recent executions...'}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
