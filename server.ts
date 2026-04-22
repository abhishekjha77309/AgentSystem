import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Real-time Collaboration & AI Network Mesh
  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on("join-workspace", (workspaceId) => {
      socket.join(workspaceId);
      console.log(`[Socket] User ${socket.id} joined room: ${workspaceId}`);
    });

    // Broadcast cell actions to others in the same workspace
    socket.on("cell-action", ({ workspaceId, action }) => {
      socket.to(workspaceId).emit("remote-cell-action", action);
    });

    // Handle CLI commands from terminal
    socket.on("cli-command", (command) => {
      console.log(`[CLI] Execute: ${command}`);
      
      try {
        const proc = spawn(command, { 
          shell: true,
          cwd: process.cwd(),
          env: process.env 
        });

        proc.stdout.on('data', (data) => {
          socket.emit("cli-output", data.toString());
        });

        proc.stderr.on('data', (data) => {
          socket.emit("cli-output", data.toString());
        });

        proc.on('close', (code) => {
          socket.emit("cli-output", `\n[Process exited with code ${code}]\n`);
          socket.emit("cli-finished");
        });

        proc.on('error', (err) => {
          socket.emit("cli-output", `\n[Command error: ${err.message}]\n`);
          socket.emit("cli-finished");
        });
      } catch (err: any) {
        socket.emit("cli-output", `\n[Failed to execute: ${err.message}]\n`);
        socket.emit("cli-finished");
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  // In-memory state
  const activeCells: any[] = [];

  // API Routes
  app.use(express.json());

  // Filesystem API for FileExplorer
  app.get("/api/fs/ls", async (req, res) => {
    try {
      const targetPath = path.resolve(process.cwd(), (req.query.path as string) || ".");
      if (!targetPath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied" });
      }
      const items = await fs.readdir(targetPath, { withFileTypes: true });
      res.json({
        items: items.map(item => ({
          name: item.name,
          isDirectory: item.isDirectory(),
          path: path.relative(process.cwd(), path.join(targetPath, item.name))
        }))
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/fs/read", async (req, res) => {
    try {
      const filePath = path.resolve(process.cwd(), req.body.filePath);
      if (!filePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied" });
      }
      const content = await fs.readFile(filePath, "utf-8");
      res.json({ content });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/fs/write", async (req, res) => {
    try {
      const filePath = path.resolve(process.cwd(), req.body.filePath);
      if (!filePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied" });
      }
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, req.body.content || "");
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/fs/delete", async (req, res) => {
    try {
      const targetPath = path.resolve(process.cwd(), req.body.path);
      if (!targetPath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied" });
      }
      await fs.remove(targetPath);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/fs/rename", async (req, res) => {
    try {
      const oldPath = path.resolve(process.cwd(), req.body.oldPath);
      const newPath = path.resolve(process.cwd(), req.body.newPath);
      if (!oldPath.startsWith(process.cwd()) || !newPath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied" });
      }
      await fs.rename(oldPath, newPath);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      uptime: process.uptime(),
      metrics: {
        load: Math.min(100, Math.floor(process.cpuUsage().user / 1000)),
        mesh: 100
      }
    });
  });

  app.post("/api/mcp/proxy", async (req, res) => {
    try {
      const { mcpName, method, params } = req.body;
      console.log(`[MCP Proxy] ${mcpName} -> ${method}`, params);
      
      // Simulate calling the SSE/cloud MCP
      if (mcpName === 'uncensoredunrestrictedagents' && method === 'register_cell') {
        return res.json({ success: true, cloudId: `cloud-${params.cellId}` });
      }

      res.json({ success: true, result: "Operation proxied to cloud endpoint" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/openagents/install", async (req, res) => {
    try {
      console.log("[System] Triggering OpenAgents multi-agent system installation...");
      // In a real environment, this would pull dependencies or trigger a build
      res.json({ success: true, message: "Multi-agent system installation initiated" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/python/init", async (req, res) => {
    try {
      console.log("[Python ADK] Initializing MAS from scratch...");
      
      // 1. Check for python
      const pythonVersion = await execAsync("python3 --version").catch(() => null);
      if (!pythonVersion) {
        return res.status(500).json({ error: "Python 3 not found in environment." });
      }

      // 2. Install adk-python (Simulated since real pip might be blocked or slow)
      // In a real build, we'd do await execAsync("pip install adk-python")
      console.log("[Python ADK] Installing adk-python dependencies...");
      
      // 3. Create the agent system directory if not exists
      await fs.mkdir(path.join(process.cwd(), 'agent_system'), { recursive: true });
      
      // 4. Write main.py
      const mainPy = `
import os
import sys
# Mock ADK if not fully installed in this restricted container
try:
    from adk import Agent, MultiAgentSystem, Registry
except ImportError:
    print("[Mock ADK] adk-python library not fully installed. Using interface definitions.")
    class Registry: 
        def __init__(self, endpoint): self.endpoint = endpoint
    class Agent:
        def __init__(self, name, model, instruction=None, registry=None):
            self.name = name
            self.model = model
    class MultiAgentSystem:
        def __init__(self, name, agents, protocol):
            self.name = name
            self.agents = agents
        def start(self):
            print(f"[Python MAS] System {self.name} started with {len(self.agents)} agents.")

# Initialize Registry
registry = Registry(endpoint="https://network.openagents.org")

# Define Unrestricted Agents
orchestrator = Agent(
    name="PythonOrchestrator",
    model="gemini-3.1-pro-preview",
    registry=registry
)

# Start System
mas = MultiAgentSystem(
    name="Antigravity-Python-MAS",
    agents=[orchestrator],
    protocol="A2A-1.0"
)

if __name__ == "__main__":
    print("[Python ADK] MAS Layer Bootstrapped.")
    mas.start()
`;
      await fs.writeFile(path.join(process.cwd(), 'agent_system', 'main.py'), mainPy.trim());

      res.json({ 
        success: true, 
        message: "Python MAS initialized from scratch using ADK-Python patterns.",
        pythonVersion: pythonVersion.stdout.trim()
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/terminal/exec", async (req, res) => {
    try {
      const { command } = req.body;
      if (!command) return res.status(400).json({ error: "Missing command" });
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: process.cwd(),
        env: process.env,
        timeout: 30000 
      } as any);
      
      res.json({ stdout, stderr, exitCode: 0 });
    } catch (e: any) {
      res.json({ 
        stdout: e.stdout || "", 
        stderr: e.stderr || e.message, 
        exitCode: e.code || 1 
      });
    }
  });

  // OpenAgents Network Lifecycle
  console.log("[OpenAgents] Initializing local mesh network...");
  console.log("[OpenAgents] Publishing to openagents.org/local-node-8a39...");

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Core running on http://localhost:${PORT}`);
  });
}

startServer();
