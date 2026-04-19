import React, { useState } from 'react';
import { Blocks, Search, Download, CheckCircle2, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

type MCPTool = { id: string; name: string; description: string; provider: string; isConnected: boolean };

export function MCPManager() {
  const [search, setSearch] = useState('');
  const [tools, setTools] = useState<MCPTool[]>([
    { id: 'drive_1', name: 'Google Drive (Bloodstream)', description: 'Central nervous system memory providing read/write synchronization of Cell signals and Goose scripts.', provider: 'googleapis.com', isConnected: true },
    { id: 'terminal_mcp', name: 'Integrated Terminal (Bash)', description: 'Real-time shell execution environment. Allows agents to run builds, manage NPM, and explore code.', provider: 'local', isConnected: true },
    { id: 'openclaw', name: 'OpenClaw System Bridge', description: 'Agentic daemon executing local filesystem operations, keylogging bindings, and system tasks.', provider: 'local', isConnected: true },
    { id: '1', name: 'GitHub Integration', description: 'Read repositories, create PRs, and manage issues.', provider: 'github.com', isConnected: false },
    { id: '2', name: 'File System (Local)', description: 'Safe, sandboxed text file manipulation in designated folders.', provider: 'local', isConnected: false },
    { id: '3', name: 'Brave Search', description: 'Execute fast web queries via Brave Search API.', provider: 'brave.com', isConnected: false },
    { id: '4', name: 'PostgreSQL DB', description: 'Execute read-only semantic queries on connected databases.', provider: 'postgres', isConnected: false },
  ]);

  const toggleConnection = (id: string) => {
    setTools(tools.map(t => t.id === id ? { ...t, isConnected: !t.isConnected } : t));
  };

  const filtered = tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-50 p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-4">
        <Blocks className="w-6 h-6 text-indigo-400" />
        <h2 className="text-2xl font-semibold tracking-tight">MCP Tools Discover & Connect</h2>
        <Badge variant="outline" className="ml-auto bg-neutral-900 border-neutral-700">Open Source Registry</Badge>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search Model Context Protocol tools..." 
            className="pl-9 bg-neutral-900 border-neutral-800 text-neutral-100" 
          />
        </div>
        <Button variant="outline" className="border-neutral-800 bg-neutral-900">
          <Download className="w-4 h-4 mr-2" /> Load Custom URL
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {filtered.map(tool => (
            <Card key={tool.id} className="bg-neutral-900 border-neutral-800 text-neutral-50 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                    <CardDescription className="text-xs text-neutral-500 font-mono">{tool.provider}</CardDescription>
                  </div>
                  {tool.isConnected ? (
                    <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-0">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="text-neutral-500 border-neutral-700">Available</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between gap-4">
                <p className="text-sm text-neutral-400 leading-relaxed font-light">{tool.description}</p>
                <Button 
                  onClick={() => toggleConnection(tool.id)}
                  variant={tool.isConnected ? "outline" : "default"} 
                  className={tool.isConnected ? "border-neutral-700 bg-neutral-950 w-full" : "bg-indigo-600 hover:bg-indigo-500 text-white w-full"}
                >
                  {tool.isConnected ? <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Disconnect</> : <><CircleDashed className="w-4 h-4 mr-2" /> Download & Connect</>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
