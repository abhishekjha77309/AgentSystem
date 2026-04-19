import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type LogEntry = {
    id: string;
    timestamp: number;
    message: string;
    level: 'info' | 'error' | 'warning' | 'success';
    source: 'system' | 'orchestrator' | 'cloud' | 'cell' | 'bloodstream';
};

export type ScheduledTask = {
    id: string;
    prompt: string;
    priority: 'low' | 'medium' | 'high';
    deadline?: number;
    isRecurring: boolean;
    cron?: string;
    status: 'pending' | 'working' | 'completed' | 'failed';
    assignedTo?: string; // Cell ID
    context?: string; // Shared context between cells
    intermediateSteps?: string[];
    linkedTaskId?: string;
    createdAt: number;
};

export type AppSnapshot = {
    id: string;
    timestamp: number;
    activeTab: string;
    activeTab2: string;
    splitMode: string;
    taskCount: number;
    description: string;
};

export type NetworkStatus = {
    isConnected: boolean;
    peerCount: number;
    lastPublishedAt?: number;
    meshId: string;
};

export type Collaborator = {
    id: string;
    name: string;
    color: string;
    lastActive: number;
};

export type RuntimeFix = {
    id: string;
    timestamp: number;
    description: string;
    resolution: string;
};

export type CodeSnippet = {
    id: string;
    name: string;
    content: string;
    category: string;
    usageCount: number;
    lastUsed?: number;
};

export type AutoSaveSettings = {
    enabled: boolean;
    interval: number; // in milliseconds
    strategy: 'onFocusLoss' | 'interval';
};

export type DownloadedModel = {
    id: string;
    name: string;
    version: string;
    size: string;
    path: string;
    type: 'tflite' | 'lite-rt' | 'onnx';
    isLoaded: boolean;
};

export type AgentPreset = {
    id: string;
    name: string;
    model: string;
    systemInstruction: string;
    framework: string;
    mcpServers: string[];
    createdAt: number;
};

export type CellTelemetry = {
    cpu: number;
    memory: number;
    errorRate: number;
    activeTasks: number;
};

export type ActiveCell = {
    id: string;
    config: AgentPreset;
    status: 'idle' | 'working' | 'error';
    currentTask?: string;
    telemetry: CellTelemetry;
};

interface IdeState {
    logs: LogEntry[];
    activeModes: string[];
    systemLoad: number;
    thinkingLevel: 'low' | 'medium' | 'high';
    preferences: {
        preferLocal: boolean;
        costSaving: boolean;
        maxCloudLoad: number;
    };
    tasks: ScheduledTask[];
    globalTaskContext: string;
    runtimeFixes: RuntimeFix[];
    snippets: CodeSnippet[];
    autoSave: AutoSaveSettings;
    downloadedModels: DownloadedModel[];
    selectedModelId: string | 'auto';
    snapshots: AppSnapshot[];
    isUiHealed: boolean;
    network: NetworkStatus;
    collaborators: Collaborator[];
    isLocalMode: boolean;
    presets: AgentPreset[];
    activeCells: ActiveCell[];
    
    // Actions
    addLog: (message: string, source?: LogEntry['source'], level?: LogEntry['level']) => void;
    toggleMode: (mode: string) => void;
    setActiveModes: (modes: string[]) => void;
    setSystemLoad: (load: number | ((prev: number) => number)) => void;
    setThinkingLevel: (level: 'low' | 'medium' | 'high') => void;
    updatePreferences: (prefs: Partial<IdeState['preferences']>) => void;
    
    // Task scheduler
    addTask: (task: Omit<ScheduledTask, 'id' | 'createdAt' | 'status'>) => void;
    updateTask: (id: string, updates: Partial<ScheduledTask>) => void;
    shareContext: (taskId: string, newContext: string, step?: string) => void;
    setGlobalTaskContext: (context: string) => void;
    
    addRuntimeFix: (fix: Omit<RuntimeFix, 'id' | 'timestamp'>) => void;
    
    // Snippets
    addSnippet: (snippet: Omit<CodeSnippet, 'id' | 'usageCount'>) => void;
    useSnippet: (id: string) => void;
    deleteSnippet: (id: string) => void;
    
    // AutoSave
    updateAutoSave: (settings: Partial<AutoSaveSettings>) => void;

    // Models
    addDownloadedModel: (model: DownloadedModel) => void;
    setSelectedModel: (id: string | 'auto') => void;
    toggleModelLoad: (id: string) => void;
    
    // Self-healing
    createSnapshot: (description: string, activeTab: string, activeTab2: string, splitMode: string) => void;
    revertToSnapshot: (snapshotId: string) => void;
    setUiHealed: (healed: boolean) => void;
    updateNetwork: (updates: Partial<NetworkStatus>) => void;
    syncFromRemote: (data: Partial<IdeState>) => void;
    setLocalMode: (enabled: boolean) => void;
    
    // Agent Management
    addPreset: (preset: Omit<AgentPreset, 'id' | 'createdAt'>) => void;
    deletePreset: (id: string) => void;
    spawnCell: (config: AgentPreset) => void;
    updateCell: (id: string, updates: Partial<ActiveCell>) => void;
    terminateCell: (id: string) => void;
}

export const useIdeStore = create<IdeState>((set) => ({
    logs: [
        { id: uuidv4(), timestamp: Date.now(), message: '[System] Antigravity IDE Initialized.', source: 'system', level: 'info' },
        { id: uuidv4(), timestamp: Date.now(), message: '[Orchestrator] Ready to orchestrate cells & cloud resources.', source: 'orchestrator', level: 'success' }
    ],
    activeModes: ['text'],
    systemLoad: 15,
    thinkingLevel: 'high',
    preferences: {
        preferLocal: false,
        costSaving: false,
        maxCloudLoad: 80,
    },
    tasks: [
        {
            id: uuidv4(),
            prompt: "Research best AI model for 'code generation' and 'UI development' with specific focus on React performance and syntax highlighting.",
            priority: 'high',
            isRecurring: false,
            status: 'pending',
            createdAt: Date.now()
        }
    ],
    globalTaskContext: "",
    runtimeFixes: [],
    snippets: [
        { id: '1', name: 'React Typed Memo', content: 'const Component = React.memo(({ children }: Props) => {\n  return <div>{children}</div>;\n});', category: 'React', usageCount: 0 },
        { id: '2', name: 'Zustand Selector', content: 'const value = useStore((s) => s.value);', category: 'State', usageCount: 0 }
    ],
    autoSave: {
        enabled: true,
        interval: 300000, // 5 mins
        strategy: 'interval'
    },
    downloadedModels: [
        { id: 'edge-watcher-100m', name: 'Watcher Cell (Edge Gallery 100M)', version: '1.0', size: '120MB', path: '/models/watcher-100m.tflite', type: 'tflite', isLoaded: true },
        { id: 'edge-fixer-7b', name: 'Autonomous Fixer (Open Source 7B)', version: 'latest', size: '4.2GB', path: '/models/fixer-uncensored-7b.gguf', type: 'lite-rt', isLoaded: false },
        { id: 'edge-1', name: 'LiteRT-Gemma-2b', version: '1.2.0', size: '1.4GB', path: '/models/gemma2b.tflite', type: 'tflite', isLoaded: true },
        { id: 'edge-2', name: 'LiteRT-Phi-3', version: '2.0.0', size: '2.1GB', path: '/models/phi3.tflite', type: 'tflite', isLoaded: false }
    ],
    selectedModelId: 'auto',
    snapshots: [],
    isUiHealed: false,
    network: {
        isConnected: false,
        peerCount: 0,
        meshId: 'local-node-' + uuidv4().slice(0, 4),
    },
    collaborators: [],
    isLocalMode: false,
    presets: [
        { id: 'default-pro', name: 'OpenClaw Pro', model: 'gemini-3.1-pro-preview', framework: 'OpenClaw', systemInstruction: 'You are a deep engineering cell.', mcpServers: ['filesystem', 'terminal'], createdAt: Date.now() },
        { id: 'default-flash', name: 'Fast Research', model: 'gemini-3-flash-preview', framework: 'SearchAgent', systemInstruction: 'Gather real-time web data.', mcpServers: ['google-search'], createdAt: Date.now() }
    ],
    activeCells: [],

    addLog: (message, source = 'system', level = 'info') => set((state) => ({
        logs: [...state.logs, { id: uuidv4(), timestamp: Date.now(), message, source, level }]
    })),
    
    toggleMode: (mode) => set((state) => {
        if (state.activeModes.includes(mode)) {
            return { activeModes: state.activeModes.length > 1 ? state.activeModes.filter(m => m !== mode) : state.activeModes };
        }
        return { activeModes: [...state.activeModes, mode] };
    }),

    setActiveModes: (modes) => set({ activeModes: modes }),

    setSystemLoad: (load) => set((state) => ({
        systemLoad: typeof load === 'function' ? load(state.systemLoad) : load
    })),

    setThinkingLevel: (level) => set({ thinkingLevel: level }),

    updatePreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
    })),

    addTask: (taskInfo) => set((state) => ({
        tasks: [...state.tasks, { ...taskInfo, id: uuidv4(), status: 'pending', createdAt: Date.now() }]
    })),

    updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    
    shareContext: (taskId, newContext, step) => set((state) => ({
        tasks: state.tasks.map(t => {
            if (t.id === taskId) {
                const intermediateSteps = step ? [...(t.intermediateSteps || []), step] : t.intermediateSteps;
                const context = newContext ? (t.context ? t.context + '\n' + newContext : newContext) : t.context;
                return { ...t, context, intermediateSteps };
            }
            return t;
        })
    })),
    
    setGlobalTaskContext: (globalTaskContext) => set({ globalTaskContext }),
    
    addRuntimeFix: (fix) => set((state) => ({
        runtimeFixes: [...state.runtimeFixes, { ...fix, id: uuidv4(), timestamp: Date.now() }]
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

    updateAutoSave: (settings) => set((state) => ({
        autoSave: { ...state.autoSave, ...settings }
    })),

    addDownloadedModel: (model) => set((state) => ({
        downloadedModels: [...state.downloadedModels, model]
    })),

    setSelectedModel: (id) => set({ selectedModelId: id }),

    toggleModelLoad: (id) => set((state) => ({
        downloadedModels: state.downloadedModels.map(m => m.id === id ? { ...m, isLoaded: !m.isLoaded } : m)
    })),

    createSnapshot: (description, activeTab, activeTab2, splitMode) => set((state) => {
        const newSnapshot: AppSnapshot = {
            id: uuidv4(),
            timestamp: Date.now(),
            activeTab,
            activeTab2,
            splitMode,
            taskCount: state.tasks.length,
            description
        };
        // Keep only last 10 snapshots
        const snapshots = [newSnapshot, ...state.snapshots].slice(0, 10);
        return { snapshots };
    }),

    revertToSnapshot: (snapshotId) => set((state) => {
        const snapshot = state.snapshots.find(s => s.id === snapshotId);
        if (!snapshot) return state;
        
        // In a real revert we'd need to notify Workspace or update Workspace state
        // For now we just log it and mark UI as recovering
        return { 
            isUiHealed: false // Reset health check
        };
    }),

    setUiHealed: (healed) => set({ isUiHealed: healed }),

    updateNetwork: (updates) => set((state) => ({
        network: { ...state.network, ...updates }
    })),

    syncFromRemote: (data) => set((state) => ({
        ...state,
        ...data
    })),

    setLocalMode: (enabled) => set({ isLocalMode: enabled }),

    addPreset: (preset) => set((state) => ({
        presets: [...state.presets, { ...preset, id: uuidv4(), createdAt: Date.now() }]
    })),

    deletePreset: (id) => set((state) => ({
        presets: state.presets.filter(p => p.id !== id)
    })),

    spawnCell: (config) => set((state) => {
        const id = 'cell-' + uuidv4().slice(0, 8);
        const logMsg = `[System] Spawned new AI Cell: ${config.name} (${id})`;
        return {
            activeCells: [...state.activeCells, {
                id,
                config,
                status: 'idle',
                telemetry: { cpu: 0, memory: 0, errorRate: 0, activeTasks: 0 }
            }],
            logs: [...state.logs, { id: uuidv4(), timestamp: Date.now(), message: logMsg, source: 'system' as const, level: 'info' as const }]
        };
    }),

    updateCell: (id, updates) => set((state) => {
        let logMsg = "";
        const cell = state.activeCells.find(c => c.id === id);
        if (cell) {
            if (updates.status && updates.status !== cell.status) {
                logMsg = `[System] Cell ${id} status changed: ${cell.status} -> ${updates.status}`;
            }
            if (updates.currentTask && updates.currentTask !== cell.currentTask) {
                logMsg = `[System] Cell ${id} executing task: ${updates.currentTask.slice(0, 50)}...`;
            }
        }

        const nextLogs = logMsg ? [...state.logs, { id: uuidv4(), timestamp: Date.now(), message: logMsg, source: 'system' as const, level: 'info' as const }] : state.logs;

        return {
            activeCells: state.activeCells.map(c => c.id === id ? { ...c, ...updates } : c),
            logs: nextLogs
        };
    }),

    terminateCell: (id) => set((state) => ({
        activeCells: state.activeCells.filter(c => c.id !== id),
        logs: [...state.logs, { id: uuidv4(), timestamp: Date.now(), message: `[System] Terminated AI Cell: ${id}`, source: 'system' as const, level: 'warning' as const }]
    }))
}));
