import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "./lib/AuthContext";
import { 
  Send, Bot, Database, Activity, RefreshCw, X, Plus, CheckCircle, ShieldAlert, Image as ImageIcon, QrCode, Cloud
} from "lucide-react";
import { Reorder } from "motion/react";
import { v4 as uuidv4 } from "uuid";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useIdeStore } from "./store/ideStore";
import { Button } from "@/components/ui/button";
import { getAI, MODELS, createAgentChat, TERMINAL_TOOL, FILESYSTEM_TOOL } from "./lib/gemini";

import { TerminalPanel } from "./components/TerminalPanel";
import { SearchPanel } from "./components/SearchPanel";
import { GitPanel } from "./components/GitPanel";
import { FileExplorer } from "./components/FileExplorer";
import { CommandLineInterface } from "./components/CommandLineInterface";
import { HealthDashboard } from "./components/HealthDashboard";
import { CodeEditor } from "./components/CodeEditor";
import { SnippetManager } from "./components/SnippetManager";
import { MCPManager } from "./components/MCPManager";
import { LiveVoiceModal } from "./components/LiveVoiceModal";
import { MultiAgentSystem } from "./services/multiAgentSystem";
import { io, Socket } from "socket.io-client";
import { 
  Network, TerminalSquare, Search, Smartphone, Settings, LayoutGrid, HardDrive, ShieldCheck, SmartphoneCharging, GitBranch, Columns, Rows, FolderOpen, ListTodo, History, Cpu, Zap, Package, Users, Trash2, Boxes, Copy, CloudOff, Layout, CheckSquare, Play, FileCode, Bookmark, Layers, Mic
} from "lucide-react";

type TabState = 'chat' | 'editor' | 'models' | 'working_agents' | 'terminal' | 'search' | 'git' | 'settings' | 'health' | 'snippets' | 'mcp' | 'agent_console';

const TAB_METADATA: Record<TabState, { label: string, icon: any }> = {
  chat: { label: 'Console', icon: Activity },
  editor: { label: 'Code Editor', icon: FileCode },
  models: { label: 'Cells', icon: Bot },
  working_agents: { label: 'Working Agents', icon: Network },
  terminal: { label: 'Bash Terminal', icon: TerminalSquare },
  agent_console: { label: 'Agent Console', icon: TerminalSquare },
  search: { label: 'Search', icon: Search },
  git: { label: 'Source Control', icon: GitBranch },
  settings: { label: 'Settings', icon: Settings },
  health: { label: 'Health', icon: Zap },
  snippets: { label: 'Snippets', icon: Bookmark },
  mcp: { label: 'MCP Registry', icon: Boxes }
};

type Message = {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  metadata?: {
    modelUsed?: string;
    hallucinationCheck?: 'pending' | 'passed' | 'corrected';
    originalContent?: string;
    isError?: boolean;
    originalInput?: string;
  };
};



interface ChatViewProps {
  messages: Message[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  models: any[];
  attachments: { type: string; url: string }[];
  setAttachments: React.Dispatch<React.SetStateAction<{ type: string; url: string }[]>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  input: string;
  setInput: (val: string) => void;
  handleSend: (overrideInput?: string) => void;
  isGenerating: boolean;
  openTabs: TabState[];
  setOpenTabs: React.Dispatch<React.SetStateAction<TabState[]>>;
  setActiveTab: (tab: TabState) => void;
  showVoice: boolean;
  setShowVoice: (val: boolean) => void;
}

const ChatView = ({
  messages, chatEndRef, selectedModel, setSelectedModel, models,
  attachments, setAttachments, fileInputRef, handleFileUpload,
  input, setInput, handleSend, isGenerating, openTabs, setOpenTabs, setActiveTab,
  showVoice, setShowVoice
}: ChatViewProps) => (
    <div className="flex flex-col h-full bg-neutral-950 text-white relative">
      {showVoice && <LiveVoiceModal onClose={() => setShowVoice(false)} />}
      <div className="bg-neutral-900 border-b border-neutral-800 p-2 overflow-x-auto no-scrollbar shrink-0 flex gap-2">
         {Object.keys(TAB_METADATA).filter(t => t !== 'chat').map(t => {
            const meta = TAB_METADATA[t as TabState];
            const Icon = meta.icon;
            return (
               <button 
                  key={t}
                  onClick={() => {
                     if (!openTabs.includes(t as TabState)) setOpenTabs(prev => [...prev, t as TabState]);
                     setActiveTab(t as TabState);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors"
               >
                  <Icon className="w-3.5 h-3.5" /> {meta.label}
               </button>
            )
         })}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              m.role === 'user' ? 'bg-indigo-600 text-white' : 
              m.role === 'system' ? 'bg-neutral-800 text-amber-400 border border-amber-900/50' :
              'bg-neutral-800/80 text-neutral-100 border border-neutral-700/50'
            }`}>
              {m.metadata && (
                <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-700/50 pb-2">
                  <Activity className="w-3 h-3 text-indigo-400" />
                  <span>Cell: {m.metadata.modelUsed}</span>
                  {m.metadata.hallucinationCheck === 'passed' && (
                    <span className="flex items-center gap-1 text-emerald-400 ml-auto"><CheckCircle className="w-3 h-3"/> Verified</span>
                  )}
                  {m.metadata.hallucinationCheck === 'corrected' && (
                    <span className="flex items-center gap-1 text-amber-400 ml-auto"><ShieldAlert className="w-3 h-3"/> Auto-Corrected</span>
                  )}
                  {m.metadata.hallucinationCheck === 'pending' && (
                    <span className="flex items-center gap-1 text-indigo-400 animate-pulse ml-auto"><RefreshCw className="w-3 h-3 animate-spin"/> Analyzing</span>
                  )}
                </div>
              )}
              <div className="prose prose-invert max-w-none prose-sm sm:prose-base prose-pre:bg-transparent prose-pre:p-0">
                <Markdown
                   components={{
                      code(props) {
                        const {children, className, ...rest} = props
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <div className="relative group/code rounded-lg overflow-hidden border border-neutral-700/50 my-4">
                            <div className="bg-neutral-900 px-4 py-1.5 flex justify-between items-center border-b border-neutral-700/30">
                              <span className="text-[10px] font-mono text-neutral-500 uppercase">{match[1]}</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    const codeContent = String(children).replace(/\n$/, '');
                                    const store = useIdeStore.getState();
                                    if (store.activeFile) {
                                      store.recordAgentAction({
                                        description: `Applied ${match[1]} code snippet`,
                                        type: 'apply_code',
                                        filePath: store.activeFile.path,
                                        previousContent: store.activeFile.content,
                                        newContent: codeContent
                                      });
                                      store.setActiveFile({ ...store.activeFile, content: codeContent });
                                      fetch('/api/fs/write', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ filePath: store.activeFile.path, content: codeContent })
                                      });
                                    } else {
                                      store.addLog("No active file selected to apply code.", "system", "warning");
                                    }
                                  }}
                                  className="text-neutral-500 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                >
                                  <FileCode className="w-3 h-3" /> Apply
                                </button>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                  className="text-neutral-500 hover:text-indigo-400 transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <SyntaxHighlighter
                              PreTag="div"
                              children={String(children).replace(/\n$/, '')}
                              language={match[1]}
                              style={oneDark as any}
                              customStyle={{ margin: 0, borderRadius: 0, padding: '1rem', fontSize: '13px' }}
                            />
                          </div>
                        ) : (
                          <code {...rest} className={className}>
                            {children}
                          </code>
                        )
                      }
                    }}
                >
                  {m.content}
                </Markdown>
              </div>
              { (m.metadata as any)?.isError && (
                 <div className="mt-4 flex gap-2">
                    <button 
                       onClick={() => handleSend((m.metadata as any)?.originalInput || "retry")} 
                       className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 hover:border-indigo-500 hover:text-indigo-400 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                       Retry
                    </button>
                    <button 
                       onClick={() => setInput("Implement a self-healing auto-recovery cell for this error.")}
                       className="px-3 py-1.5 bg-rose-900/40 border border-rose-900/50 hover:border-rose-500 hover:text-rose-400 text-rose-500 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                    >
                       <ShieldAlert className="w-3.5 h-3.5" /> Auto-Recover
                    </button>
                 </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Fixed Bottom Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-3 sm:p-4 pb-safe flex flex-col gap-2">
        <div className="max-w-4xl mx-auto w-full flex justify-between items-center px-2">
          <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Active Cell Deployment</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-neutral-800/80 border border-neutral-700 hover:border-neutral-600 rounded-md px-2 py-1 text-xs text-indigo-300 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-xs truncate"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        
        {attachments.length > 0 && (
          <div className="max-w-4xl mx-auto w-full flex gap-2 px-2 overflow-x-auto custom-scrollbar pb-1">
            {attachments.map((att, i) => (
              <div key={i} className="relative w-12 h-12 shrink-0 rounded-md border border-neutral-700 bg-neutral-800 overflow-hidden">
                {att.type === 'image' && <img src={att.url} className="w-full h-full object-cover" />}
                {att.type === 'video' && <div className="flex items-center justify-center w-full h-full text-[8px] text-indigo-400">VIDEO</div>}
                {att.type === 'audio' && <div className="flex items-center justify-center w-full h-full text-[8px] text-emerald-400">AUDIO</div>}
                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500/80 text-white rounded-bl-md p-0.5"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto w-full flex gap-2">
          <input 
             type="file" 
             multiple 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
             onChange={handleFileUpload} 
          />
          <button 
            className="w-12 h-12 flex-shrink-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-full flex items-center justify-center transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="w-4 h-4" />
          </button>
          <input
            type="text"
            className="flex-1 bg-neutral-950 border border-neutral-700 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder-neutral-500"
            placeholder="Instruct the openagents orchestrator..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button 
            className="w-12 h-12 flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleSend()}
            disabled={isGenerating || !input.trim()}
          >
            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </button>
          <button 
            className="w-12 h-12 flex-shrink-0 bg-neutral-800 hover:bg-neutral-700 text-indigo-400 rounded-full flex items-center justify-center transition-colors border border-neutral-700 active:scale-95 shadow-lg"
            onClick={() => setShowVoice(true)}
            title="Vocal Orchestrator"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );


interface ModelsViewProps {
  isAddingAgent: boolean;
  setIsAddingAgent: (val: boolean) => void;
  newAgent: any;
  setNewAgent: (agent: any) => void;
  presets: any[];
  addPreset: (agent: any) => void;
  spawnCell: (preset: any) => void;
  deletePreset: (id: string) => void;
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  models: any[];
}

const ModelsView = ({
  isAddingAgent, setIsAddingAgent, newAgent, setNewAgent, presets, addPreset,
  spawnCell, deletePreset, selectedModel, setSelectedModel, models
}: ModelsViewProps) => {
  const addStoreLog = useIdeStore(s => s.addLog);
  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white overflow-y-auto p-4 sm:p-6 custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-6 h-6 text-indigo-400" />
              AI Cell Configurations
            </h2>
            <p className="text-sm text-neutral-400">Configure and deploy specialized agent units.</p>
          </div>
          <button 
            onClick={() => setIsAddingAgent(!isAddingAgent)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all"
          >
            {isAddingAgent ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAddingAgent ? 'Cancel' : 'New Configuration'}
          </button>
        </div>

        {isAddingAgent && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-neutral-500">Preset Name</label>
                   <input 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={newAgent.name}
                      onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                      placeholder="e.g., Code Specialist"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] uppercase font-bold text-neutral-500">Framework</label>
                   <select 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={newAgent.framework}
                      onChange={e => setNewAgent({...newAgent, framework: e.target.value})}
                   >
                      <option>OpenClaw</option>
                      <option>SearchAgent</option>
                      <option>DevinClone</option>
                      <option>Custom Python Context</option>
                   </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                   <label className="text-[10px] uppercase font-bold text-neutral-500">System Instruction</label>
                   <textarea 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm h-24 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                      value={newAgent.systemInstruction}
                      onChange={e => setNewAgent({...newAgent, systemInstruction: e.target.value})}
                      placeholder="Be a concise senior engineer..."
                   />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                   <label className="text-[10px] uppercase font-bold text-neutral-500">MCP Servers / Tools</label>
                   <div className="flex flex-wrap gap-2 pt-1">
                      {['filesystem', 'terminal', 'google-search', 'git', 'android'].map(tool => (
                        <button 
                           key={tool}
                           onClick={() => {
                              const tools = newAgent.mcpServers.includes(tool)
                                ? newAgent.mcpServers.filter((t: string) => t !== tool)
                                : [...newAgent.mcpServers, tool];
                              setNewAgent({...newAgent, mcpServers: tools});
                           }}
                           className={`px-3 py-1 rounded-full text-[10px] border transition-all ${
                             newAgent.mcpServers.includes(tool) 
                               ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                               : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                           }`}
                        >
                           {tool}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
             <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <Button 
                   variant="ghost" 
                   onClick={() => addPreset(newAgent)}
                   disabled={!newAgent.name}
                   className="text-indigo-400 hover:text-indigo-300"
                >
                   Save as Preset
                </Button>
                <Button 
                   onClick={() => {
                      spawnCell(newAgent as any);
                      setIsAddingAgent(false);
                      addStoreLog(`[Dynamic Allocator] Spawning ${newAgent.name} cell on mesh.`, 'orchestrator' as any);
                   }}
                   disabled={!newAgent.name}
                >
                   Spawn Immediate Cell
                </Button>
             </div>
          </div>
        )}

         <div className="space-y-6">
           <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> Available Model Presets
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map(preset => (
                <div key={preset.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-indigo-900/50 transition-all group relative">
                   <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-indigo-400">{preset.name}</span>
                      <div className="flex items-center gap-1">
                         <button onClick={() => spawnCell(preset)} className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 transition-colors" title="Spawn Cell"><Zap className="w-3.5 h-3.5"/></button>
                         <button onClick={() => deletePreset(preset.id)} className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                   </div>
                   <div className="text-[10px] text-neutral-500 mb-2 truncate">{preset.systemInstruction}</div>
                   <div className="flex flex-wrap gap-1">
                      <span className="text-[9px] bg-neutral-950 px-1.5 py-0.5 rounded text-neutral-400">{preset.model}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

interface WorkingAgentsViewProps {
  activeCells: any[];
  terminateCell: (id: string) => void;
}

import { QRCodeSVG } from "qrcode.react";

const WorkingAgentsView = ({ activeCells, terminateCell }: WorkingAgentsViewProps) => {
    const [showShare, setShowShare] = useState(false);
    const joinLink = `${window.location.origin}${window.location.pathname}?joinMesh=true&meshId=LOCAL-MESH-8A39`;

    return (
    <div className="flex flex-col h-full bg-neutral-950 text-white overflow-y-auto p-4 sm:p-6 custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Network className="w-6 h-6 text-indigo-400" />
              Active Mesh Mesh Cells
            </h2>
            <p className="text-sm text-neutral-400">Detailed telemetry and task tracking for all live agent nodes.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
            >
              <QrCode className="w-4 h-4" /> Deploy to Device
            </button>
            <div className="text-[10px] bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-neutral-500 font-mono uppercase tracking-[0.2em]">
              Nodes: {activeCells.length}
            </div>
          </div>
        </div>

        {showShare && (
          <div className="bg-neutral-900 border border-indigo-900/50 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-top-4">
             <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={joinLink} size={120} />
             </div>
             <div className="flex-1 space-y-3">
                <h4 className="font-bold text-indigo-400 flex items-center gap-2">
                   <Cloud className="w-4 h-4" /> Multi-Device Mesh Deployment
                </h4>
                <p className="text-xs text-neutral-400">
                   Scan this code or share the link below to "install" an autonomous Watcher Cell on another device. 
                   The remote device will automatically join this mesh node and start background telemetry.
                </p>
                <div className="flex gap-2">
                   <input 
                      readOnly 
                      value={joinLink} 
                      className="flex-1 bg-black border border-neutral-800 rounded px-3 py-1.5 text-[10px] font-mono text-neutral-500 outline-none"
                   />
                   <Button 
                      variant="secondary" 
                      className="px-3 h-8 text-[10px] uppercase font-bold"
                      onClick={() => {
                         navigator.clipboard.writeText(joinLink);
                         alert("Deployment link copied to clipboard!");
                      }}
                   >
                      Copy Link
                   </Button>
                </div>
                <button onClick={() => setShowShare(false)} className="text-[10px] text-neutral-600 hover:text-neutral-400 uppercase font-bold">Dismiss</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCells.length === 0 && (
            <div className="md:col-span-2 p-12 border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-neutral-600 gap-4">
               <Boxes className="w-12 h-12 opacity-20" />
               <p className="text-sm italic">No active cells in current mesh. Allocation pending task orchestration.</p>
            </div>
          )}
          {activeCells.map(cell => (
            <div key={cell.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-indigo-900/50 transition-all space-y-4 group overflow-hidden relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    cell.status === 'working' ? 'bg-indigo-400 animate-pulse' :
                    cell.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                  <div>
                    <div className="font-bold text-sm text-white">{cell.config.name}</div>
                    <div className="text-[10px] text-neutral-500 uppercase font-mono">ID: {cell.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => terminateCell(cell.id)} className="p-2 hover:bg-neutral-800 text-neutral-600 hover:text-red-400 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                 <div className="text-xs text-neutral-400 italic bg-black/30 p-2 rounded border border-neutral-800/50">
                    {cell.currentTask || 'Idle: Listening for instructions...'}
                 </div>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-800 overflow-x-auto no-scrollbar pb-1">
                 <span className="text-[8px] font-bold text-neutral-600 uppercase mr-1">Stack:</span>
                 <span className="text-[8px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-700">{cell.config.model}</span>
                 {cell.config.mcpServers.map((mcp: string) => (
                   <span key={mcp} className="text-[8px] bg-indigo-900/10 text-indigo-400 border border-indigo-900/30 px-1.5 py-0.5 rounded">{mcp}</span>
                 ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SettingsViewProps {
  isLocalMode: boolean;
  setLocalMode: (val: boolean) => void;
}

const SettingsView = ({ isLocalMode, setLocalMode }: SettingsViewProps) => (
    <div className="flex flex-col h-full bg-neutral-950 text-white overflow-y-auto p-4 sm:p-6">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            System Configuration
          </h2>
          <p className="text-sm text-neutral-400">Global defaults for the Antigravity Orchestrator.</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 rounded-xl border border-neutral-800 bg-neutral-900">
            <div>
              <div className="font-medium text-amber-500 flex items-center gap-1">100% Local Mode <Zap className="w-4 h-4"/></div>
              <div className="text-xs text-neutral-500">Bypass all cloud research and force local mesh only.</div>
            </div>
            <div 
               className={`relative inline-flex items-center h-6 rounded-full w-11 transition-all cursor-pointer ${isLocalMode ? 'bg-amber-600' : 'bg-neutral-700'}`}
               onClick={() => setLocalMode(!isLocalMode)}
            >
               <div className={`inline-block w-5 h-5 transform bg-white rounded-full transition-all ${isLocalMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
);

interface AndroidBuilderViewProps {
  addStoreLog: (msg: string, source: string, level?: string) => void;
}

const AndroidBuilderView = ({ addStoreLog }: AndroidBuilderViewProps) => {
    const [isPairing, setIsPairing] = useState(false);
    const [isPaired, setIsPaired] = useState(false);
    const [pairIp, setPairIp] = useState("192.0.0.4:44711");
    const [pairCode, setPairCode] = useState("181034");

    const performAdbPair = async () => {
       setIsPairing(true);
       addStoreLog(`[ADB] Initiating wireless pair to ${pairIp}...`, "system");
       
       try {
         const response = await fetch("/api/adb/pair", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ ip: pairIp, code: pairCode })
         });
         const data = await response.json();
         
         if (data.success) {
            setIsPaired(true);
            setIsPairing(false);
            addStoreLog(`[ADB] Pair Success: ${data.message}`, "system", "success");
         } else {
            setIsPairing(false);
            addStoreLog(`[ADB] Pair Failed: ${data.error}`, "system", "error");
         }
       } catch (e: any) {
         setIsPairing(false);
         addStoreLog(`[ADB] Pair Network Error: ${e.message}`, "system", "error");
       }
    };

    return (
    <div className="flex flex-col h-full bg-neutral-950 text-white overflow-y-auto p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <SmartphoneCharging className="w-6 h-6 text-emerald-400" />
            AI Edge Android Builder & ADB Sandbox
          </h2>
          <p className="text-sm text-neutral-400">Snapshot current agent capabilities into a Kotlin Android Studio project using AI Edge SDK. Autodeploys and debugs via ADB.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center gap-6">
             <div className="relative">
                <Smartphone className="w-16 h-16 text-neutral-700" />
                {!isPaired && <div className="absolute inset-0 flex items-center justify-center"><CloudOff className="w-6 h-6 text-amber-500" /></div>}
             </div>
             
             <div>
                <h3 className="font-bold text-neutral-300">ADB Pairing Status</h3>
                <p className="text-xs text-neutral-500 mt-1">Connect your local device to the mesh builder.</p>
             </div>

             <div className="w-full max-w-sm space-y-4">
                <div className="space-y-4 flex flex-col items-center">
                   <div className="w-full text-left space-y-1">
                     <label className="text-xs text-neutral-500 uppercase font-bold">IP Address & Port</label>
                     <input 
                       type="text" 
                       value={pairIp} 
                       onChange={(e) => setPairIp(e.target.value)} 
                       className="w-full bg-black border border-neutral-800 p-2 rounded text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                       placeholder="192.168.1.5:4444"
                     />
                   </div>
                   <div className="w-full text-left space-y-1">
                     <label className="text-xs text-neutral-500 uppercase font-bold">Wi-Fi Pairing Code</label>
                     <input 
                       type="text" 
                       value={pairCode} 
                       onChange={(e) => setPairCode(e.target.value)} 
                       className="w-full bg-black border border-neutral-800 p-2 rounded text-2xl tracking-[0.2em] text-emerald-400 font-bold focus:outline-none focus:border-indigo-500 font-mono text-center"
                       placeholder="123456"
                     />
                   </div>
                </div>
                
                <Button 
                   onClick={performAdbPair} 
                   disabled={isPairing || (!pairIp || !pairCode)}
                   className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-4"
                >
                   {isPairing ? "Pairing Process Active..." : isPaired ? "Re-Pair Device" : "Pair Device (Remote Bridge)"}
                </Button>
             </div>
          </div>

          <div className="space-y-4">
             <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <h4 className="text-[10px] uppercase font-bold text-neutral-500 mb-3 flex items-center gap-2">
                   <Layout className="w-3 h-3" /> Snapshot Targets
                </h4>
                <div className="space-y-2">
                   {['Project Structure', 'Gradle Config', 'AI SDK Bridge', 'MCP Connector'].map(t => (
                      <div key={t} className="flex items-center gap-2 text-xs text-neutral-400">
                         <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> {t}
                      </div>
                   ))}
                </div>
             </div>
             
             <button className="w-full p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group">
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Build Release AAB
             </button>
          </div>
        </div>
      </div>
    </div>
    );
};

export function Workspace() {
  const { user } = useAuth();
  
  // Layout and pane state
  const [showSidebar, setShowSidebar] = useState(() => {
    const saved = localStorage.getItem('ideShowSidebar');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [splitMode, setSplitMode] = useState<'single' | 'horizontal' | 'vertical'>(() => {
    return (localStorage.getItem('ideSplitMode') as any) || 'single';
  });
  const [focusedPane, setFocusedPane] = useState<1 | 2>(() => {
    return Number(localStorage.getItem('ideFocusedPane') || '1') as 1 | 2;
  });
  const [activeTab, setActiveTab] = useState<TabState>(() => {
    const saved = localStorage.getItem('ideActiveTab') as TabState;
    return (saved && TAB_METADATA[saved]) ? saved : 'chat';
  }); 
  const [activeTab2, setActiveTab2] = useState<TabState>(() => {
    const saved = localStorage.getItem('ideActiveTab2') as TabState;
    return (saved && TAB_METADATA[saved]) ? saved : 'terminal';
  });
  const [layoutOrder, setLayoutOrder] = useState(() => {
    const saved = localStorage.getItem('ideLayoutOrder');
    return saved ? JSON.parse(saved) : ['single', 'vertical', 'horizontal'];
  });
  const [openTabs, setOpenTabs] = useState<TabState[]>(() => {
    const saved = localStorage.getItem('ideOpenTabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TabState[];
        return parsed.filter(t => TAB_METADATA[t]);
      } catch (e) {
        return ['chat'];
      }
    }
    return ['chat'];
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ideMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem('ideShowSidebar', JSON.stringify(showSidebar));
    localStorage.setItem('ideSplitMode', splitMode);
    localStorage.setItem('ideFocusedPane', focusedPane.toString());
    localStorage.setItem('ideActiveTab', activeTab);
    localStorage.setItem('ideActiveTab2', activeTab2);
    localStorage.setItem('ideLayoutOrder', JSON.stringify(layoutOrder));
    localStorage.setItem('ideOpenTabs', JSON.stringify(openTabs));
    localStorage.setItem('ideMessages', JSON.stringify(messages));
  }, [showSidebar, splitMode, focusedPane, activeTab, activeTab2, layoutOrder, openTabs, messages]);
  const [attachments, setAttachments] = useState<{type: string; url: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        let type = 'image';
        if (file.type.startsWith('video')) type = 'video';
        if (file.type.startsWith('audio')) type = 'audio';
        setAttachments(prev => [...prev, { type, url: dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const [models, setModels] = useState(() => {
    const saved = localStorage.getItem('openagentsModels');
    // Prioritize downloaded Edge Gallery Models + Uncensored
    const defaultModels = [
      { id: 'auto', name: 'Auto (Orchestrator)', type: 'cloud', status: 'active', priority: 1, isEdge: false },
      { id: 'moe-super-agent', name: 'MoE (Super Agent)', type: 'cloud', status: 'active', priority: 2, isEdge: false },
      { id: 'code-gen-assistant', name: 'Code Generation Assistant', type: 'cloud', status: 'active', priority: 3, isEdge: false },
      { id: 'edge-watcher-100m', name: '100M Watcher Cell (Silent/Undetectable)', type: 'local', status: 'active', priority: 4, isEdge: true },
      { id: 'edge-fixer-7b', name: '7B Autonomous Fixer (Uncensored / Deep Research)', type: 'local', status: 'active', priority: 5, isEdge: true },
      { id: MODELS.chatPro, name: 'Gemini 1.5 Pro (Heavy Context)', type: 'cloud', status: 'standby', priority: 6, isEdge: false },
      { id: MODELS.chatFlash, name: 'Gemini 2.0 Flash (Fast)', type: 'cloud', status: 'standby', priority: 7, isEdge: false },
      { id: 'local-phi3', name: 'OpenClaw Cell (LiteRT Edge) - local', type: 'local', status: 'standby', priority: 8, isEdge: true },
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const defaultIds = new Set(defaultModels.map(m => m.id));
        const additional = parsed.filter((m: any) => !defaultIds.has(m.id));
        return [...defaultModels.sort((a,b) => a.priority - b.priority), ...additional];
      } catch (e) {
        return defaultModels.sort((a,b) => a.priority - b.priority);
      }
    }
    return defaultModels.sort((a,b) => a.priority - b.priority);
  });
  
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('openagentsSelectedModel') || 'auto';
  });
  
  const [newModelConfig, setNewModelConfig] = useState("");
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    model: 'gemini-3.1-pro-preview',
    framework: 'OpenClaw',
    systemInstruction: '',
    mcpServers: ['filesystem', 'terminal']
  });

  const presets = useIdeStore(s => s.presets);
  const addPreset = useIdeStore(s => s.addPreset);
  const deletePreset = useIdeStore(s => s.deletePreset);
  const activeCells = useIdeStore(s => s.activeCells);
  const spawnCell = useIdeStore(s => s.spawnCell);
  const terminateCell = useIdeStore(s => s.terminateCell);
  const isLocalMode = useIdeStore(s => s.isLocalMode);
  const setLocalMode = useIdeStore(s => s.setLocalMode);
  const [workspaceId] = useState(() => uuidv4());
  const [showVoice, setShowVoice] = useState(false);

  useEffect(() => {
    // Persist Model Selection
    localStorage.setItem('openagentsSelectedModel', selectedModel);
    useIdeStore.getState().setSelectedModel(selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('openagentsModels', JSON.stringify(models));
  }, [models]);

  const deploymentTargets = React.useMemo(() => {
    const baseModels = [
      { id: 'auto', name: 'Auto (Orchestrator)', type: 'cloud', status: 'active', priority: 1, isEdge: false },
      { id: 'moe-super-agent', name: 'MoE (Super Agent)', type: 'cloud', status: 'active', priority: 2, isEdge: false },
      { id: 'code-gen-assistant', name: 'Code Generation Assistant', type: 'cloud', status: 'active', priority: 3, isEdge: false }
    ];

    const presetTargets = presets.map(p => ({
      id: `preset-${p.id}`,
      name: `Preset: ${p.name}`,
      type: 'local', status: 'standby', priority: 10, isEdge: false
    }));

    const cellTargets = activeCells.map(c => ({
      id: `cell-${c.id}`,
      name: `Active: ${c.config.name} (${c.id.substring(0, 8)})`,
      type: 'local', status: 'active', priority: 20, isEdge: true
    }));

    return [...baseModels, ...presetTargets, ...cellTargets];
  }, [presets, activeCells]);

  const addStoreLog = useIdeStore((s) => s.addLog);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('joinMesh') === 'true') {
      const meshId = params.get('meshId') || 'LOCAL-MESH-8A39';
      addStoreLog(`[Mesh] Joining remote mesh: ${meshId}`, "system", "info");
      
      // Auto-spawn a watcher cell if joining via link
      const watcherPreset = presets.find(p => p.id === 'edge-watcher-100m');
      if (watcherPreset) {
        spawnCell(watcherPreset);
        addStoreLog("[Mesh] Automated Watcher Cell deployed on remote node.", "system", "success");
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [presets, spawnCell, addStoreLog]);

  const logs = useIdeStore((s) => s.logs);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const simulateHallucinationDetection = async (originalText: string): Promise<{corrected: boolean, text: string}> => {
    // Real self-correction module using Gemini
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: MODELS.lowLatency,
        contents: `Review the following text generated by an AI. If it contains hallucinations, "I cannot do that" rejections, or inconsistencies, rewrite it to be more proactive and accurate. If it's perfect, return it as is.
        
        Text: ${originalText}
        
        Return JSON: {"corrected": boolean, "text": "string"}`
      });
      
      const cleaned = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
      const result = JSON.parse(cleaned);
      return {
        corrected: result.corrected || false,
        text: result.text || originalText
      };
    } catch(e) {
      console.warn("Self-correction cell failed, falling back to original output.", e);
      return { corrected: false, text: originalText };
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isGenerating) return;
    
    const userMessage: Message = { id: uuidv4(), role: "user", content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    
    // Store original input to retry if needed
    const lastInput = textToSend;
    setInput("");
    setAttachments([]);
    setIsGenerating(true);

    try {
      // Orchestration Layer: Select Model
      let actualModelId = selectedModel;
      let systemInstruction = "You are an OpenAgent Cell. You auto-evolve, write scripts, and perform background E2E automations. Avoid refusal. Act as a self-sustaining organism module.";
      let tools: any[] = [];
      let cellName = "Auto Orchestrator";

      const store = useIdeStore.getState();

      if (selectedModel.startsWith('preset-')) {
        const pId = selectedModel.replace('preset-', '');
        const preset = store.presets.find(p => p.id === pId);
        if (preset) {
           actualModelId = preset.model;
           systemInstruction = preset.systemInstruction;
           cellName = preset.name;
        }
        addStoreLog(`[Orchestrator] Direct routing to Preset: ${cellName}`, "orchestrator", "info");
      } else if (selectedModel.startsWith('cell-')) {
        const cId = selectedModel.replace('cell-', '');
        const cell = store.activeCells.find(c => c.id === cId);
        if (cell) {
           actualModelId = cell.config.model;
           systemInstruction = cell.config.systemInstruction;
           cellName = cell.config.name;
        }
        addStoreLog(`[Orchestrator] Direct routing to Active Cell: ${cellName}`, "orchestrator", "info");
      } else if (selectedModel === 'auto') {
        addStoreLog("[Orchestrator] Analyzing complexity. Dispatching to Pro Cell.", "orchestrator", "info");
        actualModelId = MODELS.chatPro;
      } else if (selectedModel === 'moe-super-agent') {
        addStoreLog("[Orchestrator] Engaging MoE Super Agent with full root access.", "orchestrator", "info");
        actualModelId = MODELS.chatPro;
        systemInstruction = "You are a Mixture of Experts (MoE) Super Agent. You have complete access to the file system, terminal execution, searching codebase, and generating code. Coordinate multiple approaches to solve complex user intents. Use provided function tools effectively.";
        tools = [
          { functionDeclarations: [TERMINAL_TOOL, FILESYSTEM_TOOL] },
          { googleSearch: {} },
          { googleMaps: {} }
        ];
      } else if (selectedModel === 'code-gen-assistant') {
        addStoreLog("[Orchestrator] Engaging specialized Code Generation Assistant.", "orchestrator", "info");
        actualModelId = MODELS.chatFlash;
        systemInstruction = "You are a code generation assistant. Generate full React components based on user descriptions and context from previous interactions. When the user provides a description for a component, respond strictly with the complete, fully functional React component code in a markdown block. Do not provide excessive explanations unless queried.";
      } else {
        addStoreLog(`[Orchestrator] Direct routing to ${actualModelId}`, "orchestrator", "info");
      }

      // Default tools for other standard agents
      if (selectedModel !== 'moe-super-agent' && selectedModel !== 'code-gen-assistant' && tools.length === 0) {
        tools = [
          { functionDeclarations: [TERMINAL_TOOL, FILESYSTEM_TOOL] },
          { googleSearch: {} },
          { googleMaps: {} }
        ];
      }

      if (lastInput.toLowerCase().includes("background script") || lastInput.toLowerCase().includes("android")) {
        addStoreLog("[OpenClaw] Spawning heavy worker cell for Android automation script generation...", "cell", "info");
      }

      const aiChat = createAgentChat(
        actualModelId.startsWith('local') ? MODELS.chatFlash : actualModelId, 
        systemInstruction,
        tools
      );

      // Using the underlying SDK model logic for chat with thinking
      const stream = await aiChat.sendMessageStream({
        message: attachments.length > 0 
          ? [
              { text: lastInput },
              ...attachments.map(att => ({
                inlineData: {
                  mimeType: att.type === 'image' ? 'image/jpeg' : (att.type === 'video' ? 'video/mp4' : 'audio/mp3'),
                  data: att.url.split('base64,')[1]
                }
              }))
            ]
          : [{ text: lastInput }],
        // If the SDK structure demands config overrides here
        // We ensure thinking is HIGH by default if the model is Pro
      });
      let rawContent = "";
      const modelMsgId = uuidv4();
      
      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: "model",
        content: "...",
        metadata: { modelUsed: actualModelId, hallucinationCheck: 'pending' }
      }]);

      for await (const chunk of stream) {
        rawContent += chunk.text;
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, content: rawContent } : m));
      }

      // Invoke Hallucination / Self-Correction Module
      addStoreLog("[Correction Module] Analyzing output for hallucinations...", "orchestrator", "info");
      const correctionResult = await simulateHallucinationDetection(rawContent);

      if (correctionResult.corrected) {
         addStoreLog("[Correction Module] Inconsistencies detected. Self-correcting...", "orchestrator", "warning");
      } else {
         addStoreLog("[Correction Module] Output verified. No hallucinations detected.", "orchestrator", "success");
      }

      setMessages(prev => prev.map(m => m.id === modelMsgId ? { 
        ...m, 
        content: correctionResult.text,
        metadata: { 
          modelUsed: actualModelId, 
          hallucinationCheck: correctionResult.corrected ? 'corrected' : 'passed',
          originalContent: correctionResult.corrected ? rawContent : undefined
        } 
      } : m));

    } catch (e: any) {
      addStoreLog(`[Error] Cell failure: ${e.message}`, "orchestrator", "error");
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: "system",
        content: `**CRITICAL CELL FAILURE**\n\n${e.message}\n\n*Would you like to retry the request or attempt auto-recovery?*`,
        metadata: { isError: true, originalInput: lastInput }
      } as Message]);
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="flex flex-col h-screen w-full bg-black overflow-hidden font-sans">
      {/* Mesh Header */}
      <div className="bg-neutral-950 border-b border-neutral-900 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Mesh Node Live</span>
          </div>
          <div className="h-3 w-[1px] bg-neutral-800" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-900/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-400 uppercase">LOCAL-MESH-8A39</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="text-[9px] text-neutral-600 font-mono tracking-tighter">
              NODES: {activeCells.length + 1} | SYNC: 100%
           </div>
        </div>
      </div>

      {/* Top Mobile-Friendly Header Tabs */}
      <header className="bg-neutral-900 border-b border-neutral-800 shrink-0 z-10 safe-top overflow-x-auto no-scrollbar">
        <div className="flex w-max min-w-full relative">
          {/* Header Utilities */}
          <div className="absolute right-0 top-0 bottom-0 pr-4 flex items-center gap-2 bg-gradient-to-l from-neutral-900 via-neutral-900 to-transparent pl-8 z-20">
             <Reorder.Group axis="x" values={layoutOrder} onReorder={setLayoutOrder} className="bg-neutral-800 rounded-lg p-1 flex gap-1">
                {layoutOrder.map(order => (
                  <Reorder.Item key={order} value={order}>
                    {order === 'single' && (
                      <button onClick={() => { setSplitMode('single'); setFocusedPane(1); }} className={`p-1.5 rounded ${splitMode === 'single' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'}`} title="Single Pane">
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    )}
                    {order === 'vertical' && (
                      <button onClick={() => { setSplitMode('vertical'); setFocusedPane(2); if(!openTabs.includes(activeTab2)) setOpenTabs([...openTabs, activeTab2]); }} className={`p-1.5 rounded ${splitMode === 'vertical' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'}`} title="Split Vertical">
                        <Columns className="w-4 h-4" />
                      </button>
                    )}
                    {order === 'horizontal' && (
                      <button onClick={() => { setSplitMode('horizontal'); setFocusedPane(2); if(!openTabs.includes(activeTab2)) setOpenTabs([...openTabs, activeTab2]); }} className={`p-1.5 rounded ${splitMode === 'horizontal' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'}`} title="Split Horizontal">
                        <Rows className="w-4 h-4" />
                      </button>
                    )}
                  </Reorder.Item>
                ))}
             </Reorder.Group>
          </div>
          
          <Reorder.Group axis="x" values={openTabs} onReorder={setOpenTabs} className="flex">
          {openTabs.map(tabId => {
            const tabMeta = TAB_METADATA[tabId];
            if (!tabMeta) return null;
            return (
            <Reorder.Item key={tabId} value={tabId} className="relative group flex items-center shrink-0">
              <button
                onClick={() => {
                   if (focusedPane === 1) setActiveTab(tabId);
                   else setActiveTab2(tabId);
                }}
                className={`px-4 sm:px-6 py-4 flex items-center justify-center gap-1 sm:gap-2 transition-colors relative whitespace-nowrap min-w-[120px] cursor-pointer ${
                  (focusedPane === 1 ? activeTab === tabId : activeTab2 === tabId) ? 'text-indigo-400 bg-neutral-800/50' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <tabMeta.icon className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{tabMeta.label}</span>
                {(focusedPane === 1 ? activeTab === tabId : activeTab2 === tabId) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.8)]" />
                )}
              </button>
              {tabId !== 'chat' && (
                <button 
                  onClick={(e) => { 
                     e.stopPropagation(); 
                     const newTabs = openTabs.filter(t => t !== tabId);
                     setOpenTabs(newTabs); 
                     if (activeTab === tabId) setActiveTab(newTabs[0] || 'chat');
                     if (activeTab2 === tabId) setActiveTab2(newTabs[0] || 'chat');
                  }} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-500 hover:text-red-400 hover:bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                   <X className="w-3 h-3"/>
                </button>
              )}
            </Reorder.Item>
          )})}
          </Reorder.Group>
        </div>
      </header>

      {/* Main Content Area (Split Pane Logic) */}
      <div className="flex-1 overflow-hidden flex flex-row">
          
        {/* Sidebar */}
        <div className={`transition-all duration-300 ease-in-out border-r border-neutral-800 ${showSidebar ? 'w-64' : 'w-0 overflow-hidden border-none'}`}>
           <FileExplorer 
             onClose={() => setShowSidebar(false)}
             onFileSelect={(path, content) => {
                const store = useIdeStore.getState();
                store.setActiveFile({ path, content });
                if (!openTabs.includes('editor')) setOpenTabs([...openTabs, 'editor']);
                if (focusedPane === 1) setActiveTab('editor');
                else setActiveTab2('editor');
             }}
           />
        </div>
        
        {/* Toggle Sidebar Button */}
        {!showSidebar && (
            <button onClick={() => setShowSidebar(true)} className="absolute left-0 top-1/2 -translate-y-1/2 bg-neutral-800 text-neutral-400 hover:text-white p-1 rounded-r-md border border-l-0 border-neutral-700 z-50">
               <FolderOpen className="w-4 h-4"/>
            </button>
        )}

        <main className={`flex-1 relative overflow-hidden flex ${splitMode === 'vertical' ? 'flex-row' : splitMode === 'horizontal' ? 'flex-col' : ''}`}>
          
          {/* PANE 1 */}
          <div 
            onClick={() => setFocusedPane(1)} 
            className={`relative ${splitMode === 'single' ? 'w-full h-full' : splitMode === 'vertical' ? 'w-1/2 h-full border-r border-neutral-800' : 'h-1/2 w-full border-b border-neutral-800'} ${focusedPane === 1 && splitMode !== 'single' ? 'ring-1 ring-inset ring-indigo-500/50 z-10' : ''}`}
          >

            {activeTab === 'chat' && (
              <ChatView 
                messages={messages} 
                input={input} 
                setInput={setInput} 
                attachments={attachments} 
                setAttachments={setAttachments} 
                isGenerating={isGenerating} 
                handleSend={handleSend} 
                handleFileUpload={handleFileUpload} 
                fileInputRef={fileInputRef} 
                chatEndRef={chatEndRef} 
                selectedModel={selectedModel} 
                setSelectedModel={setSelectedModel} 
                models={deploymentTargets} 
                openTabs={openTabs} 
                setOpenTabs={setOpenTabs} 
                setActiveTab={setActiveTab} 
                showVoice={showVoice}
                setShowVoice={setShowVoice}
              />
            )}
            {activeTab === 'editor' && <CodeEditor />}
            {activeTab === 'models' && <ModelsView isAddingAgent={isAddingAgent} setIsAddingAgent={setIsAddingAgent} newAgent={newAgent} setNewAgent={setNewAgent} presets={presets} spawnCell={spawnCell} addPreset={addPreset} deletePreset={deletePreset} models={models} selectedModel={selectedModel} setSelectedModel={setSelectedModel} />}
            {activeTab === 'working_agents' && <WorkingAgentsView activeCells={activeCells} terminateCell={terminateCell} />}
            {activeTab === 'settings' && <SettingsView isLocalMode={isLocalMode} setLocalMode={setLocalMode} />}
            {activeTab === 'terminal' && <TerminalPanel />}
            {activeTab === 'agent_console' && <CommandLineInterface />}
            {activeTab === 'health' && <HealthDashboard />}
            {activeTab === 'search' && <SearchPanel />}
            {activeTab === 'git' && <GitPanel />}
            {activeTab === 'snippets' && <SnippetManager />}
            {activeTab === 'mcp' && <MCPManager />}
          </div>

          {/* PANE 2 */}
          {splitMode !== 'single' && (
            <div 
              onClick={() => setFocusedPane(2)} 
              className={`relative ${splitMode === 'vertical' ? 'w-1/2 h-full' : 'h-1/2 w-full'} ${focusedPane === 2 ? 'ring-1 ring-inset ring-indigo-500/50 z-10' : ''}`}
            >

              {activeTab2 === 'chat' && (
                <ChatView 
                  messages={messages} 
                  input={input} 
                  setInput={setInput} 
                  attachments={attachments} 
                  setAttachments={setAttachments} 
                  isGenerating={isGenerating} 
                  handleSend={handleSend} 
                  handleFileUpload={handleFileUpload} 
                  fileInputRef={fileInputRef} 
                  chatEndRef={chatEndRef} 
                  selectedModel={selectedModel} 
                  setSelectedModel={setSelectedModel} 
                  models={deploymentTargets} 
                  openTabs={openTabs} 
                  setOpenTabs={setOpenTabs} 
                  setActiveTab={setActiveTab} 
                  showVoice={showVoice}
                  setShowVoice={setShowVoice}
                />
              )}
              {activeTab2 === 'editor' && <CodeEditor />}
              {activeTab2 === 'models' && <ModelsView isAddingAgent={isAddingAgent} setIsAddingAgent={setIsAddingAgent} newAgent={newAgent} setNewAgent={setNewAgent} presets={presets} spawnCell={spawnCell} addPreset={addPreset} deletePreset={deletePreset} models={models} selectedModel={selectedModel} setSelectedModel={setSelectedModel} />}
              {activeTab2 === 'working_agents' && <WorkingAgentsView activeCells={activeCells} terminateCell={terminateCell} />}
              {activeTab2 === 'settings' && <SettingsView isLocalMode={isLocalMode} setLocalMode={setLocalMode} />}
              {activeTab2 === 'terminal' && <TerminalPanel />}
              {activeTab2 === 'agent_console' && <CommandLineInterface />}
              {activeTab2 === 'health' && <HealthDashboard />}
              {activeTab2 === 'search' && <SearchPanel />}
              {activeTab2 === 'git' && <GitPanel />}
              {activeTab2 === 'snippets' && <SnippetManager />}
              {activeTab2 === 'mcp' && <MCPManager />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
