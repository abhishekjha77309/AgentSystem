import React, { useState } from 'react';
import { Bookmark, Plus, Search, Trash2, Copy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdeStore, CodeSnippet } from '../store/ideStore';

export const SnippetManager: React.FC = () => {
    const snippets = useIdeStore(s => s.snippets);
    const addSnippet = useIdeStore(s => s.addSnippet);
    const useSnippetAction = useIdeStore(s => s.useSnippet);
    const deleteSnippet = useIdeStore(s => s.deleteSnippet);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [newSnippet, setNewSnippet] = useState({ name: '', content: '', category: 'General' });
    const [isAdding, setIsAdding] = useState(false);

    const filteredSnippets = snippets.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = (snippet: CodeSnippet) => {
        navigator.clipboard.writeText(snippet.content);
        useSnippetAction(snippet.id);
    };

    const handleAdd = () => {
        if (!newSnippet.name || !newSnippet.content) return;
        addSnippet(newSnippet);
        setNewSnippet({ name: '', content: '', category: 'General' });
        setIsAdding(false);
    };

    return (
        <div className="flex flex-col h-full bg-neutral-950/40 text-neutral-300">
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Snippets Library</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAdding(!isAdding)}>
                    <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                </Button>
            </div>

            {isAdding && (
                <div className="p-3 bg-neutral-900/50 border-b border-neutral-800 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <input 
                        placeholder="Snippet Name"
                        value={newSnippet.name}
                        onChange={e => setNewSnippet(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs"
                    />
                    <textarea 
                        placeholder="Code content..."
                        value={newSnippet.content}
                        onChange={e => setNewSnippet(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs h-24 font-mono"
                    />
                    <div className="flex gap-2">
                        <input 
                            placeholder="Category"
                            value={newSnippet.category}
                            onChange={e => setNewSnippet(prev => ({ ...prev, category: e.target.value }))}
                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs"
                        />
                        <Button onClick={handleAdd} className="bg-indigo-600 h-8 px-4 text-xs font-bold">Save</Button>
                    </div>
                </div>
            )}

            <div className="p-2 border-b border-neutral-800">
                <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-neutral-600" />
                    <input 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Filter snippets..."
                        className="w-full bg-neutral-900 border-none rounded pl-8 h-8 text-xs focus:ring-0"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredSnippets.map(snippet => (
                    <div key={snippet.id} className="group p-2 bg-neutral-900/30 border border-neutral-900 rounded-lg hover:border-neutral-800 transition-all">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-neutral-200">{snippet.name}</span>
                            <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-tighter">{snippet.category}</span>
                        </div>
                        <pre className="text-[10px] font-mono text-neutral-500 bg-neutral-950/50 p-2 rounded overflow-x-hidden line-clamp-2 mb-2 italic">
                            {snippet.content}
                        </pre>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-neutral-700">Used {snippet.usageCount} times</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(snippet)} title="Copy Snippet">
                                    <Copy className="w-3 h-3 text-neutral-400" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSnippet(snippet.id)} title="Delete Snippet">
                                    <Trash2 className="w-3 h-3 text-red-900/40 hover:text-red-500" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
