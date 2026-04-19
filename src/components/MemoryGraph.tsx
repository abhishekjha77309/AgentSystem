import React, { useState } from 'react';
import { Network, Database, Plus, Search, Trash2, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Node = { id: string; label: string; type: string };
type Edge = { id: string; source: string; target: string; relation: string };

export function MemoryGraph() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', label: 'User Context', type: 'Person' },
    { id: '2', label: 'Antigravity IDE', type: 'System' },
    { id: '3', label: 'Android Workflows', type: 'Concept' },
  ]);
  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1', source: '1', target: '2', relation: 'USES' },
    { id: 'e2', source: '2', target: '3', relation: 'ORCHESTRATES' },
  ]);

  const [newNode, setNewNode] = useState('');
  const [newType, setNewType] = useState('Concept');

  const addNode = () => {
    if (!newNode.trim()) return;
    setNodes([...nodes, { id: Date.now().toString(), label: newNode, type: newType }]);
    setNewNode('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-50 p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-4">
        <Network className="w-6 h-6 text-indigo-400" />
        <h2 className="text-2xl font-semibold tracking-tight">Agent Graph Memory</h2>
        <Badge variant="outline" className="ml-auto bg-neutral-900 border-neutral-700">Async Synced</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 flex flex-col h-[50vh]">
          <CardHeader className="py-4 border-b border-neutral-800">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" /> Node Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex gap-2">
              <Input 
                value={newNode} 
                onChange={e => setNewNode(e.target.value)} 
                placeholder="New Entity name..." 
                className="bg-neutral-800 border-neutral-700" 
              />
              <Button onClick={addNode} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950 p-4 custom-scrollbar">
              <div className="space-y-2">
                {nodes.map(n => (
                  <div key={n.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-medium text-sm">{n.label}</span>
                      <Badge variant="secondary" className="text-[10px] ml-2 bg-neutral-800">{n.type}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 flex flex-col h-[50vh]">
          <CardHeader className="py-4 border-b border-neutral-800">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Semantic Relations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950 p-4 custom-scrollbar">
              <div className="space-y-2">
                {edges.map(e => {
                  const sourceNode = nodes.find(n => n.id === e.source)?.label;
                  const targetNode = nodes.find(n => n.id === e.target)?.label;
                  return (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-sm">
                      <span className="font-semibold text-indigo-300">{sourceNode}</span>
                      <span className="text-neutral-500 text-xs tracking-wider uppercase">—[{e.relation}]→</span>
                      <span className="font-semibold text-emerald-300">{targetNode}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
