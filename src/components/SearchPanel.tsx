import React, { useState } from 'react';
import { Search, FileText, Loader2, Database, Code, Maximize2, SplitSquareHorizontal } from 'lucide-react';
import { useIdeStore } from '../store/ideStore';

interface SearchResult {
    filePath?: string;
    lineNum?: string;
    content: string;
    type?: 'file' | 'memory' | 'tab';
    title?: string;
}

export const SearchPanel: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTarget, setSearchTarget] = useState<'all' | 'code' | 'memory'>('all');
    
    // Preview states
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    const logs = useIdeStore(s => s.logs);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim() || loading) return;

        setLoading(true);
        let allResults: SearchResult[] = [];

        try {
            // Memory logs search
            if (searchTarget === 'all' || searchTarget === 'memory') {
                const lowerQ = query.toLowerCase();
                const matchedLogs = logs.filter(l => l.message.toLowerCase().includes(lowerQ));
                allResults.push(...matchedLogs.map(l => ({
                    content: l.message,
                    type: 'memory' as const,
                    title: `Log: ${l.source} [${l.level}]`
                })));
            }

            // Codebase search
            if (searchTarget === 'all' || searchTarget === 'code') {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.results) {
                    allResults.push(...data.results.map((r: any) => ({
                        ...r, type: 'file', title: r.filePath
                    })));
                }
            }

            setResults(allResults);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPreview = async (filePath: string) => {
        setSelectedFile(filePath);
        setLoadingPreview(true);
        try {
            const res = await fetch('/api/terminal/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: `cat "${filePath}"` })
            });
            const data = await res.json();
            setFileContent(data.stdout || data.stderr || 'No content or binary file.');
        } catch (err: any) {
            setFileContent(err.message || 'Error loading preview.');
        } finally {
            setLoadingPreview(false);
        }
    };

    const highlightSearch = (text: string, q: string) => {
        if (!q) return text;
        const parts = text.split(new RegExp(`(${q})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === q.toLowerCase() ? 
                    <mark key={i} className="bg-amber-500/30 text-amber-200 px-0.5 rounded">{part}</mark> : 
                    part
                )}
            </span>
        );
    };

    return (
        <div className="flex flex-col h-full bg-neutral-950 text-neutral-300">
            <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 space-y-2 shrink-0">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                    <input 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Global Search (Files, Memory, Workflows)..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-9 pr-3 h-9 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder-neutral-600"
                    />
                    <div className="absolute right-2 top-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
                    </div>
                </form>
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button onClick={() => setSearchTarget('all')} className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold transition-all ${searchTarget === 'all' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'}`}>All</button>
                        <button onClick={() => setSearchTarget('code')} className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold transition-all flex items-center gap-1 ${searchTarget === 'code' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'}`}><Code className="w-3 h-3"/> Code</button>
                        <button onClick={() => setSearchTarget('memory')} className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold transition-all flex items-center gap-1 ${searchTarget === 'memory' ? 'bg-cyan-600 text-white' : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'}`}><Database className="w-3 h-3"/> Memory</button>
                    </div>
                    <button onClick={() => setShowPreview(!showPreview)} className="text-neutral-500 hover:text-indigo-400" title="Toggle Preview Pane">
                        <SplitSquareHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className={`flex-1 overflow-hidden flex ${showPreview && selectedFile ? 'flex-row' : 'flex-col'}`}>
                {/* Search Results List */}
                <div className={`overflow-y-auto p-2 ${showPreview && selectedFile ? 'w-1/2 border-r border-neutral-800' : 'w-full'}`}>
                    {results.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-48 text-neutral-600 gap-2">
                            <Search className="w-8 h-8 opacity-20" />
                            <span className="text-xs italic">Enter a query to search across the system</span>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {/* Group memory results */}
                        {results.filter(r => r.type === 'memory').length > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 bg-neutral-900/50 p-1.5 rounded border border-cyan-900/30 sticky top-0">
                                    <Database className="w-3 h-3" />
                                    <span>Agent Memory Logs</span>
                                </div>
                                <div className="space-y-0.5 divide-y divide-neutral-900">
                                    {results.filter(r => r.type === 'memory').map((hit, i) => (
                                        <div key={i} className="group flex items-start gap-3 p-2 hover:bg-white/5 rounded transition-colors">
                                            <code className="text-[11px] text-neutral-400 font-mono break-all">
                                                <span className="text-cyan-600 font-bold mr-2">[{hit.title}]</span>
                                                {highlightSearch(hit.content, query)}
                                            </code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Unique files group */}
                        {Object.entries(
                            results.filter(r => r.type === 'file').reduce((acc, res) => {
                                if (res.filePath) {
                                    if (!acc[res.filePath]) acc[res.filePath] = [];
                                    acc[res.filePath].push(res);
                                }
                                return acc;
                            }, {} as Record<string, SearchResult[]>)
                        ).map(([file, hits]) => (
                            <div key={file} className="space-y-1">
                                <div 
                                    className={`flex items-center gap-2 text-xs font-bold bg-neutral-900/50 p-1.5 rounded border sticky top-0 cursor-pointer transition-colors ${selectedFile === file ? 'text-emerald-400 border-emerald-900/50' : 'text-neutral-400 border-neutral-800/50 hover:bg-neutral-800/80'}`}
                                    onClick={() => loadPreview(file)}
                                >
                                    <FileText className={`w-3 h-3 ${selectedFile === file ? 'text-emerald-400' : 'text-indigo-400'}`} />
                                    <span>{file}</span>
                                    <span className="ml-auto text-[10px] bg-neutral-800 px-1.5 rounded-full text-neutral-500">{hits.length} hits</span>
                                </div>
                                <div className="space-y-0.5 divide-y divide-neutral-900">
                                    {hits.map((hit, i) => (
                                        <div key={i} className="group flex items-start gap-3 p-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer" onClick={() => loadPreview(file)}>
                                            <span className="text-[10px] text-neutral-600 font-mono w-8 text-right shrink-0 mt-0.5">{hit.lineNum}</span>
                                            <code className="text-[11px] text-neutral-400 font-mono break-all line-clamp-2">
                                                {highlightSearch(hit.content, query)}
                                            </code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* File Preview Pane */}
                {showPreview && selectedFile && (
                    <div className="w-1/2 flex flex-col bg-neutral-950 overflow-hidden">
                        <div className="bg-neutral-900 border-b border-neutral-800 p-2 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono truncate">
                                <Maximize2 className="w-3 h-3" />
                                {selectedFile}
                            </div>
                            <button onClick={() => setSelectedFile(null)} className="text-neutral-500 hover:text-red-400 p-1">
                                &times;
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {loadingPreview ? (
                                <div className="flex items-center justify-center h-full text-neutral-600 gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> Loading preview...
                                </div>
                            ) : (
                                <pre className="text-[11px] font-mono leading-tight text-neutral-300">
                                    {highlightSearch(fileContent, query)}
                                </pre>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
