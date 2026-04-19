import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, File as FileIcon, ChevronRight, ChevronDown, Plus, Trash2, Edit2, FileText, RefreshCw, X } from 'lucide-react';

interface FsItem {
  name: string;
  isDirectory: boolean;
  path: string;
}

export const FileExplorer: React.FC<{
  onFileSelect?: (path: string, content: string) => void;
  onClose?: () => void;
}> = ({ onFileSelect, onClose }) => {
  const [items, setItems] = useState<FsItem[]>([]);
  const [currentPath, setCurrentPath] = useState('.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState('');
  const [isCreatingMode, setIsCreatingMode] = useState<'file' | 'dir' | null>(null);
  
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fs/ls?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setItems(data.items.sort((a: any, b: any) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        }));
        setCurrentPath(path);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  const handleCreate = async () => {
    if (!newItemName) return;
    try {
      const targetPath = `${currentPath === '.' ? '' : currentPath + '/'}${newItemName}`;
      if (isCreatingMode === 'dir') {
          // hack logic, write an empty .keep file to create dir
          await fetch('/api/fs/write', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: `${targetPath}/.keep`, content: '' })
          });
      } else {
          await fetch('/api/fs/write', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: targetPath, content: '' })
          });
      }
      setIsCreatingMode(null);
      setNewItemName('');
      loadDirectory(currentPath);
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (path: string, isDirectory: boolean) => {
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;
    try {
      await fetch('/api/fs/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, isDirectory })
      });
      loadDirectory(currentPath);
    } catch (e: any) { setError(e.message); }
  };

  const handleRename = async (oldPath: string) => {
    if (!renameValue) return;
    const oldDir = oldPath.split('/').slice(0, -1).join('/');
    const newPath = `${oldDir === '' ? '' : oldDir + '/'}${renameValue}`;
    try {
      await fetch('/api/fs/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPath, newPath })
      });
      setRenamingItem(null);
      loadDirectory(currentPath);
    } catch (e: any) { setError(e.message); }
  };

  const openFile = async (path: string) => {
    try {
      const res = await fetch('/api/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: path })
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else if (onFileSelect) onFileSelect(path, data.content);
    } catch(e: any) { setError(e.message); }
  };

  return (
    <div className="w-64 h-full bg-neutral-900 border-r border-neutral-800 flex flex-col text-sm text-neutral-300">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 shrink-0">
         <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-indigo-400">
            <FolderOpen className="w-4 h-4"/> Explorer
         </span>
         <div className="flex gap-1.5 items-center">
            <button onClick={() => setIsCreatingMode('file')} className="p-1 hover:bg-neutral-800 hover:text-white rounded" title="New File"><FileText className="w-3.5 h-3.5"/></button>
            <button onClick={() => setIsCreatingMode('dir')} className="p-1 hover:bg-neutral-800 hover:text-white rounded" title="New Folder"><Folder className="w-3.5 h-3.5"/></button>
            <button onClick={() => loadDirectory(currentPath)} className="p-1 hover:bg-neutral-800 hover:text-white rounded" title="Refresh"><RefreshCw className="w-3.5 h-3.5"/></button>
            {onClose && <button onClick={onClose} className="p-1 hover:bg-neutral-800 hover:text-red-400 rounded" title="Close"><X className="w-3.5 h-3.5"/></button>}
         </div>
      </div>
      
      {error && <div className="p-2 text-xs bg-red-950/50 text-red-400 border-b border-red-900/50 truncate break-all" title={error}>{error}</div>}
      
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
        {currentPath !== '.' && (
            <div 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-800/80 cursor-pointer rounded transition-colors text-emerald-400"
                onClick={() => loadDirectory(currentPath.split('/').slice(0, -1).join('/') || '.')}
            >
                <ChevronDown className="w-4 h-4" /> <FolderOpen className="w-3.5 h-3.5" /> <span>..</span>
            </div>
        )}
        
        {loading ? (
           <div className="p-4 flex items-center justify-center text-indigo-500"><RefreshCw className="w-4 h-4 animate-spin"/></div>
        ) : (
           <>
              {isCreatingMode && (
                 <div className="flex items-center gap-2 px-2 py-1 bg-indigo-900/20 border border-indigo-500/50 rounded">
                    {isCreatingMode === 'dir' ? <Folder className="w-3.5 h-3.5 text-indigo-400"/> : <FileText className="w-3.5 h-3.5 text-indigo-400"/>}
                    <input 
                       autoFocus
                       className="bg-transparent border-none outline-none text-white text-xs w-full placeholder-indigo-300"
                       placeholder="Name..."
                       value={newItemName}
                       onChange={e => setNewItemName(e.target.value)}
                       onKeyDown={e => {
                           if (e.key === 'Enter') handleCreate();
                           if (e.key === 'Escape') setIsCreatingMode(null);
                       }}
                       onBlur={() => setIsCreatingMode(null)}
                    />
                 </div>
              )}

              {items.map(item => (
                <div key={item.path} className="group relative pr-12">
                   {renamingItem === item.path ? (
                       <div className="flex items-center gap-2 px-2 py-1 bg-emerald-900/20 border border-emerald-500/50 rounded w-full">
                           <input
                              autoFocus
                              className="bg-transparent border-none outline-none text-white text-xs w-full"
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => {
                                  if (e.key === 'Enter') handleRename(item.path);
                                  if (e.key === 'Escape') setRenamingItem(null);
                              }}
                              onBlur={() => setRenamingItem(null)}
                           />
                       </div>
                   ) : (
                       <div 
                           className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-800/80 cursor-pointer rounded transition-colors"
                           onClick={() => item.isDirectory ? loadDirectory(item.path) : openFile(item.path)}
                       >
                           {item.isDirectory ? <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> : <FileIcon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />}
                           <span className="truncate flex-1 text-xs">{item.name}</span>
                       </div>
                   )}
                   
                   {!renamingItem && (
                       <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 px-1 rounded-r shadow-[-8px_0_10px_rgba(23,23,23,1)]">
                          <button onClick={(e) => { e.stopPropagation(); setRenameValue(item.name); setRenamingItem(item.path); }} className="p-1 text-neutral-500 hover:text-emerald-400"><Edit2 className="w-3 h-3"/></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(item.path, item.isDirectory); }} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                       </div>
                   )}
                </div>
              ))}
              {items.length === 0 && !isCreatingMode && <div className="text-center text-neutral-600 text-xs mt-4 italic">Empty Directory</div>}
           </>
        )}
      </div>
    </div>
  );
};
