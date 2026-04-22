import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type LogEntry = {
    id: string;
    timestamp: number;
    message: string;
    level: 'info' | 'error' | 'warning' | 'success';
    source: 'system' | 'agent' | 'terminal' | 'filesystem' | 'orchestrator' | 'cell' | 'cloud' | 'bloodstream';
};

export type AgentPreset = {
    id: string;
    name: string;
    model: string;
    systemInstruction: string;
    framework?: string;
    mcpServers: string[];
    createdAt: number;
};

export type ActiveCell = {
    id: string;
    config: AgentPreset;
    status: 'idle' | 'working' | 'error';
    currentTask?: string;
};

export type AgentAction = {
    id: string;
    description: string;
    type: 'apply_code' | 'delete_file' | 'create_file';
    filePath: string;
    previousContent: string;
    newContent: string;
    timestamp: number;
    undone: boolean;
};

export type CodeSnippet = {
    id: string;
    name: string;
    content: string;
    category: string;
    usageCount: number;
    lastUsed?: number;
};

interface IdeState {
    logs: LogEntry[];
    selectedModelId: string | 'auto';
    isLocalMode: boolean;
    presets: AgentPreset[];
    activeCells: ActiveCell[];
    activeFile: { path: string, content: string } | null;
    agentActions: AgentAction[];
    mcpConfigurations: Record<string, any>;
    snippets: CodeSnippet[];
    
    // Actions
    setActiveFile: (file: { path: string, content: string } | null) => void;
    recordAgentAction: (action: Omit<AgentAction, 'id' | 'timestamp' | 'undone'>) => void;
    undoAgentAction: () => void;
    redoAgentAction: () => void;
    addMcpConfig: (name: string, config: any) => void;
    addLog: (message: string, source?: LogEntry['source'], level?: LogEntry['level']) => void;
    
    // Agent Management
    addPreset: (preset: Omit<AgentPreset, 'id' | 'createdAt'>) => void;
    deletePreset: (id: string) => void;
    spawnCell: (config: AgentPreset) => void;
    terminateCell: (id: string) => void;

    // Snippets
    addSnippet: (snippet: Omit<CodeSnippet, 'id' | 'usageCount'>) => void;
    useSnippet: (id: string) => void;
    deleteSnippet: (id: string) => void;
    setSelectedModel: (id: string) => void;
    setLocalMode: (enabled: boolean) => void;
}

export const useIdeStore = create<IdeState>()(
  persist(
    (set) => ({
      logs: [
          { id: uuidv4(), timestamp: Date.now(), message: '[System] IDE Initialized.', source: 'system', level: 'info' }
      ],
    isLocalMode: false,
    selectedModelId: 'auto',
    snippets: [
        { id: '1', name: 'React Typed Memo', content: 'const Component = React.memo(({ children }: Props) => {\n  return <div>{children}</div>;\n});', category: 'React', usageCount: 0 },
        { id: '2', name: 'Zustand Selector', content: 'const value = useStore((s) => s.value);', category: 'State', usageCount: 0 }
    ],
    presets: [
        { id: 'default-pro', name: 'Gemini Pro', model: 'gemini-1.5-pro', systemInstruction: 'You are a deep engineering assistant.', framework: 'React/ADK', mcpServers: [], createdAt: Date.now() },
        { id: 'default-flash', name: 'Gemini Flash', model: 'gemini-2.0-flash', systemInstruction: 'You are a fast, concise assistant.', framework: 'Express/ADK', mcpServers: [], createdAt: Date.now() },
        { id: 'edge-watcher-100m', name: '100M Watcher Cell', model: 'gemini-2.0-flash', systemInstruction: 'You are a silent watcher cell. Monitor system logs and background processes. Report only on critical anomalies.', framework: 'Background/Edge', mcpServers: ['filesystem'], createdAt: Date.now() }
    ],
    activeCells: [],
    activeFile: null,
    agentActions: [],
    mcpConfigurations: {},

    setActiveFile: (activeFile) => set({ activeFile }),

    addMcpConfig: (name, config) => set((state) => ({
        mcpConfigurations: { ...state.mcpConfigurations, [name]: config }
    })),

    recordAgentAction: (action) => set((state) => {
        const currentActions = state.agentActions.filter(a => !a.undone);
        return {
            agentActions: [...currentActions, { ...action, id: uuidv4(), timestamp: Date.now(), undone: false }]
        };
    }),

    undoAgentAction: () => set((state) => {
        const reversedActions = [...state.agentActions].reverse();
        const actionToUndo = reversedActions.find(a => !a.undone);
        if (actionToUndo) {
            if (state.activeFile?.path === actionToUndo.filePath) {
                state.setActiveFile({ path: actionToUndo.filePath, content: actionToUndo.previousContent });
            }
            fetch('/api/fs/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: actionToUndo.filePath, content: actionToUndo.previousContent })
            });
            return {
                agentActions: state.agentActions.map(a => a.id === actionToUndo.id ? { ...a, undone: true } : a)
            };
        }
        return state;
    }),

    redoAgentAction: () => set((state) => {
        const actionToRedo = state.agentActions.find(a => a.undone);
        if (actionToRedo) {
            if (state.activeFile?.path === actionToRedo.filePath) {
                state.setActiveFile({ path: actionToRedo.filePath, content: actionToRedo.newContent });
            }
            fetch('/api/fs/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: actionToRedo.filePath, content: actionToRedo.newContent })
            });

            return {
                agentActions: state.agentActions.map(a => a.id === actionToRedo.id ? { ...a, undone: false } : a)
            };
        }
        return state;
    }),

    addLog: (message, source = 'system', level = 'info') => set((state) => ({
        logs: [...state.logs, { id: uuidv4(), timestamp: Date.now(), message, source, level }]
    })),
    
    addPreset: (preset) => set((state) => ({
        presets: [...state.presets, { ...preset, id: uuidv4(), createdAt: Date.now() }]
    })),

    deletePreset: (id) => set((state) => ({
        presets: state.presets.filter(p => p.id !== id)
    })),

    spawnCell: (config) => set((state) => {
        const id = 'cell-' + uuidv4().slice(0, 8);
        return {
            activeCells: [...state.activeCells, {
                id,
                config,
                status: 'idle'
            }],
            logs: [...state.logs, { id: uuidv4(), timestamp: Date.now(), message: `Spawned AI Cell: ${config.name}`, source: 'system', level: 'info' }]
        };
    }),

    terminateCell: (id) => set((state) => ({
        activeCells: state.activeCells.filter(c => c.id !== id),
        logs: [...state.logs, { id: uuidv4(), timestamp: Date.now(), message: `Terminated AI Cell: ${id}`, source: 'system', level: 'warning' }]
    })),

    addSnippet: (snippet) => set((state) => ({
        snippets: [...state.snippets, { ...snippet, id: uuidv4(), usageCount: 0 }]
    })),

    useSnippet: (id) => set((state) => ({
        snippets: state.snippets.map(s => s.id === id ? { ...s, usageCount: s.usageCount + 1, lastUsed: Date.now() } : s)
    })),

    deleteSnippet: (id) => set((state) => ({
        snippets: state.snippets.filter(s => s.id !== id)
    })),

    setSelectedModel: (id) => set({ selectedModelId: id }),
    setLocalMode: (enabled) => set({ isLocalMode: enabled })
  }),
  {
    name: 'antigravity-ide-storage',
    partialize: (state) => ({ 
      selectedModelId: state.selectedModelId,
      isLocalMode: state.isLocalMode,
      presets: state.presets,
      snippets: state.snippets,
      mcpConfigurations: state.mcpConfigurations
    })
  }
));
