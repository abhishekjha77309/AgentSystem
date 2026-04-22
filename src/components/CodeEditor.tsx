import React, { useRef, useEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useIdeStore } from '../store/ideStore';
import { getAI, MODELS } from '../lib/gemini';
import { Undo2, Redo2, Save } from 'lucide-react';

export function CodeEditor() {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  
  const activeFile = useIdeStore(s => s.activeFile);
  const setActiveFile = useIdeStore(s => s.setActiveFile);
  const undoAgentAction = useIdeStore(s => s.undoAgentAction);
  const redoAgentAction = useIdeStore(s => s.redoAgentAction);
  const agentActions = useIdeStore(s => s.agentActions);
  const hasUndo = agentActions.filter(a => !a.undone).length > 0;
  const hasRedo = agentActions.filter(a => a.undone).length > 0;

  const [saving, setSaving] = useState(false);
  const [localContent, setLocalContent] = useState("");

  useEffect(() => {
    if (activeFile) {
       setLocalContent(activeFile.content);
    } else {
       setLocalContent("");
    }
  }, [activeFile?.path, activeFile?.content]);

  useEffect(() => {
    if (monaco) {
      // Register AI code completion provider
      const provider = monaco.languages.registerInlineCompletionsProvider('*', {
        provideInlineCompletions: async (model, position, context, token) => {
          const lineText = model.getLineContent(position.lineNumber);
          
          if (lineText.trim().length < 3) return { items: [] };

          const beforeCursor = model.getValueInRange({
            startLineNumber: Math.max(1, position.lineNumber - 10),
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          });

          try {
            const ai = getAI(); 
            const response = await ai.models.generateContent({
              model: MODELS.chatFlash,
              contents: `You are an inline code completion assistant. Provide ONLY the precise code snippet that logically completes the following code block. Do NOT include markdown blocks, do not repeat the code, only output what comes next.
Context:
${beforeCursor}`
            });

            let suggestion = response.text || "";
            suggestion = suggestion.replace(/^```[\w]*\n/, '').replace(/```$/, '');

            if (suggestion) {
               return {
                  items: [{
                    insertText: suggestion,
                    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
                  }]
               };
            }
            return { items: [] };
          } catch(e) {
            return { items: [] };
          }
        },
        disposeInlineCompletions() {}
      });

      return () => provider.dispose();
    }
  }, [monaco]);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleSave = async (val: string | undefined) => {
     if (!activeFile || !val) return;
     setSaving(true);
     setActiveFile({ ...activeFile, content: val });
     try {
       await fetch('/api/fs/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: activeFile.path, content: val })
       });
     } catch (e) {
       console.error("Failed to save via fetch", e);
     }
     setSaving(false);
  };

  // Auto-save logic
  useEffect(() => {
     const timer = setTimeout(() => {
        if (editorRef.current && activeFile) {
           const currentVal = editorRef.current.getValue();
           if (currentVal !== activeFile.content) {
              handleSave(currentVal);
           }
        }
     }, 5000);
     return () => clearTimeout(timer);
  }, [activeFile?.content]);

  return (
    <div className="w-full h-full bg-[#1e1e1e] flex flex-col">
       <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
             <span className="text-xs text-neutral-400 font-mono">{activeFile ? activeFile.path : 'No file selected'}</span>
             {saving && <span className="text-[10px] text-indigo-400 animate-pulse">Saving...</span>}
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={undoAgentAction} 
               disabled={!hasUndo}
               title="Undo Last Agent Action"
               className={`p-1.5 rounded ${hasUndo ? 'text-neutral-300 hover:bg-neutral-800' : 'text-neutral-600 cursor-not-allowed'}`}
             >
                <Undo2 className="w-4 h-4" />
             </button>
             <button 
               onClick={redoAgentAction} 
               disabled={!hasRedo}
               title="Redo Last Agent Action"
               className={`p-1.5 rounded ${hasRedo ? 'text-neutral-300 hover:bg-neutral-800' : 'text-neutral-600 cursor-not-allowed'}`}
             >
                <Redo2 className="w-4 h-4" />
             </button>
             <button 
               onClick={() => editorRef.current && handleSave(editorRef.current.getValue())} 
               disabled={!activeFile}
               title="Save File"
               className={`p-1.5 rounded ${activeFile ? 'text-indigo-400 hover:bg-neutral-800' : 'text-neutral-600 cursor-not-allowed'}`}
             >
                <Save className="w-4 h-4" />
             </button>
          </div>
       </div>
       <div className="flex-1 relative">
         {!activeFile ? (
           <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
             Select a file from the explorer to begin editing
           </div>
         ) : (
           <Editor
             key={activeFile.path}
             height="100%"
             theme="vs-dark"
             language={activeFile.path.split('.').pop() === 'ts' || activeFile.path.split('.').pop() === 'tsx' ? 'typescript' : 'javascript'}
             defaultValue={activeFile.content}
             onChange={(val) => {
                // local edits tracked in editorRef
             }}
             onMount={handleEditorMount}
             options={{
               inlineSuggest: { enabled: true },
               minimap: { enabled: false },
               fontSize: 14,
               wordWrap: 'on'
             }}
           />
         )}
       </div>
    </div>
  );
}
