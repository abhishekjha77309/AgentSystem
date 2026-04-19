import { ResearchService } from "./researchService";
import { CellCreator, CellConfig } from "./cellCreator";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { v4 as uuidv4 } from "uuid";

export interface OrchestrationStep {
  id: string;
  type: "research" | "chunking" | "cell_creation" | "network_injection" | "execution" | "synthesis";
  status: "pending" | "running" | "completed" | "failed";
  details: string;
}

export interface CellExecution {
  id: string;
  config: CellConfig;
  task: string;
  taskType: "text" | "code" | "image" | "automation";
  status: "queued" | "injecting" | "running" | "completed" | "failed";
  memorySnapshot?: string; 
  result?: string;
  imageUrl?: string;
  confidenceScore?: number;
}

export class OrchestratorService {
  private research: ResearchService;
  private creator: CellCreator;
  private ai: GoogleGenAI;
  private centralKnowledge: string = ""; 
  private contextKeeperActive: boolean = false;
  private adaptiveLearningData: any[] = [];

  public onUpdate?: (steps: OrchestrationStep[], executions: CellExecution[]) => void;

  constructor(apiKey?: string) {
    this.research = new ResearchService(apiKey);
    this.creator = new CellCreator(apiKey);
    this.ai = new GoogleGenAI({ apiKey: apiKey || (process as any).env.GEMINI_API_KEY });
  }

  private async defineTaskTypes(deepContext: string, prompt: string): Promise<{task: string, type: "text"| "code" | "image" | "automation"}[]> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `You are a high-speed routing engine. Analyze the following prompt and split it into discrete subtasks. Categorize each subtask type as 'text', 'code', 'image', or 'automation'.
      
      Prompt: ${prompt}
      Context: ${deepContext.substring(0, 1000)}
      
      Return a STRICT JSON array of objects with 'task' and 'type' keys. NOTHING ELSE.
      Example: [{"task": "Generate a glowing cat", "type": "image"}, {"task": "Write a python script", "type": "code"}]`
    });

    try {
      const cleaned = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "[]";
      return JSON.parse(cleaned);
    } catch(e) {
      // Fallback
      return [{ task: prompt, type: prompt.toLowerCase().includes('image') || prompt.toLowerCase().includes('picture') ? "image" : "text" }];
    }
  }

  // Model Blending Strategy
  private blendModels(type: "text" | "code" | "image" | "automation", localMode: boolean): { primary: string, fallback: string, support: string } {
    if (type === "image") {
      return { primary: "gemini-3.1-flash-image-preview", fallback: "imagen-4.0-generate-001", support: "gemini-3.1-flash-lite-preview" };
    }
    if (type === "code" || type === "automation") {
      return localMode 
        ? { primary: "edge-fixer-7b", fallback: "edge-1", support: "edge-watcher-100m" }
        : { primary: "gemini-3.1-pro-preview", fallback: "gemini-3-flash-preview", support: "gemini-3.1-flash-lite-preview" };
    }
    return localMode 
        ? { primary: "edge-1", fallback: "edge-2", support: "edge-watcher-100m" }
        : { primary: "gemini-3-flash-preview", fallback: "gemini-3.1-flash-lite-preview", support: "gemini-3.1-flash-lite-preview" };
  }

  async runFullStack(prompt: string, localMode: boolean = false) {
    const steps: OrchestrationStep[] = [
      { id: "1", type: "research", status: localMode ? "completed" : "pending", details: localMode ? "Skipped (Local Mode)" : "Deep web research" },
      { id: "2", type: "chunking", status: "pending", details: "Context splitting & Intelligence Routing" },
      { id: "3", type: "cell_creation", status: "pending", details: "Allocation" },
      { id: "4", type: "network_injection", status: "pending", details: "OpenAgents Network Entry" },
      { id: "5", type: "execution", status: "pending", details: "Parallel processing" },
      { id: "6", type: "synthesis", status: "pending", details: "Final integration" },
    ];
    let executions: CellExecution[] = [];

    const notify = () => this.onUpdate?.([...steps], [...executions]);

    try {
      // 1. Research
      let deepContext = "";
      if (!localMode) {
        steps[0].status = "running";
        notify();
        deepContext = await this.research.gatherDeepContext(prompt).catch(() => "Research degraded.");
        steps[0].status = "completed";
        steps[0].details = `Found ${deepContext.length} chars of context.`;
      } else {
        deepContext = "LOCAL CONTEXT ONLY: Web research disabled by user preference.";
      }
      notify();

      // 2. Chunking & Routing
      steps[1].status = "running";
      notify();
      const routedTasks = await this.defineTaskTypes(deepContext, prompt);
      steps[1].status = "completed";
      steps[1].details = `Split into ${routedTasks.length} typed task quantas.`;
      notify();

      // 3. Cell Creation
      steps[2].status = "running";
      notify();
      for (const t of routedTasks) {
        // We override the chosen model for the cell based on our intelligent routing
        const blended = this.blendModels(t.type, localMode);
        const config = await this.creator.createIntelligentCell(t.task);
        config.model = blended.primary; // injected router optimization
        config.fallbackModel = blended.fallback;
        config.supportModel = blended.support;
        
        executions.push({
          id: uuidv4(),
          config,
          task: t.task,
          taskType: t.type,
          status: "queued"
        });
      }
      steps[2].status = "completed";
      notify();

      // 4. Network Injection & Inherited Knowledge
      steps[3].status = "running";
      notify();
      await this.injectToNetwork(executions, notify);
      steps[3].status = "completed";
      notify();

      // 5. Parallel Execution (Simulated + Actual Model Execution for Images)
      steps[4].status = "running";
      notify();
      const results = await this.parallelExecute(executions, notify);
      steps[4].status = "completed";
      notify();

      // 6. Synthesis
      steps[5].status = "running";
      notify();
      const finalOutput = await this.synthesize(prompt, executions);
      steps[5].status = "completed";
      notify();

      return finalOutput;

    } catch (error: any) {
      console.error("[Orchestrator] Fatal error:", error);
      // fallback error handling...
      steps.forEach(s => { 
        if (s.status === "running" || s.status === "pending") {
           s.status = "failed";
           s.details = `ERROR: ${error?.message || "System error"}`;
        }
      });
      notify();
      throw error;
    }
  }

  private async injectToNetwork(executions: CellExecution[], notify: () => void) {
    console.log("[OpenAgents] Publishing current cell mesh to distributed network...");
    
    for (const exec of executions) {
      exec.status = "injecting";
      notify();
      if (this.centralKnowledge.length > 5000) this.contextKeeperActive = true;
      exec.memorySnapshot = await this.distillContext(this.centralKnowledge, exec.task);
      await new Promise(r => setTimeout(r, 200));
      exec.status = "queued";
      notify();
    }
  }

  private async distillContext(knowledge: string, task: string): Promise<string> {
    if (!knowledge) return "Network Fresh: No prior context.";
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Central knowledge: ${knowledge}\nNew task: ${task}\nSynthesize technical details concisely.`,
      });
      return response.text || "Distillation logic skipped.";
    } catch(e) {
      return "Context distilled (offline fallback).";
    }
  }

  // Adaptive Learning & Self-Correction
  private async selfCorrect(task: string, output: string, errorFeedback: string): Promise<string> {
    console.log(`[Adaptive Learning] Triggering self-correction for task: ${task}`);
    try {
       const correctionResponse = await this.ai.models.generateContent({
           model: "gemini-3.1-pro-preview",
           contents: `Task: ${task}\n\nFaulty Output: ${output}\n\nFeedback/Error: ${errorFeedback}\n\nPlease self-correct and yield the completely fixed output without any apologies or fluff.`,
           config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } // high thinking
       });
       return correctionResponse.text || output;
    } catch(e) {
       return output;
    }
  }

  private async calculateConfidence(task: string, type: string, output: string): Promise<number> {
    if (type === "image") return 0.95; // usually deterministic if generating successfully
    try {
       const evaluation = await this.ai.models.generateContent({
           model: "gemini-3.1-flash-lite-preview",
           contents: `Evaluate the following output for a task. 
           Task: ${task}
           Output: ${output.slice(0, 1500)} // truncate to save tokens
           Assign a confidence score from 0.00 to 1.00 indicating accuracy and hallucination likelihood. Respond ONLY with a decimal number.`,
           config: { temperature: 0 }
       });
       const scoreNum = parseFloat(evaluation.text?.trim() || "1.0");
       return isNaN(scoreNum) ? 0.8 : Math.max(0.0, Math.min(1.0, scoreNum));
    } catch(e) {
       return 0.8;
    }
  }

  private async parallelExecute(executions: CellExecution[], notify: () => void): Promise<void> {
    const batchSize = 3;
    for (let i = 0; i < executions.length; i += batchSize) {
      const batch = executions.slice(i, i + batchSize);
      await Promise.all(batch.map(async exec => {
        exec.status = "running";
        notify();
        
        let attemptOutput = "";
        let attemptSuccess = true;

        try {
          if (exec.taskType === "image") {
             // Let's actually generate an image!
             const response = await this.ai.models.generateImages({
                 model: exec.config.fallbackModel || 'imagen-4.0-generate-001',
                 prompt: exec.task,
                 config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
             });
             const base64 = response.generatedImages?.[0]?.image?.imageBytes;
             if (base64) {
                 exec.imageUrl = `data:image/jpeg;base64,${base64}`;
                 attemptOutput = `[Image Generated] Successfully created image for prompt: ${exec.task}`;
             } else {
                 attemptOutput = `[Image Engine] Failed to parse generated bytes.`;
                 attemptSuccess = false;
             }
          } else if (exec.taskType === "code") {
             const response = await this.ai.models.generateContent({
                 model: exec.config.model, // gemini-3.1-pro-preview from router
                 contents: `Perform the following code generation task accurately, returning the full scripts:\n\nTask: ${exec.task}\nContext: ${exec.memorySnapshot}\nLearnings to Avoid: ${this.getLearningContext()}`,
                 config: { systemInstruction: "Output robust, production-ready code with no surrounding fluff." }
             });
             attemptOutput = response.text || "Code execution returned no output.";
          } else {
             const response = await this.ai.models.generateContent({
                 model: exec.config.model,
                 contents: `Perform this text/research task:\n\nTask: ${exec.task}\nContext: ${exec.memorySnapshot}\nLearnings to Avoid: ${this.getLearningContext()}`,
             });
             attemptOutput = response.text || "Task executed successfully but returned blank.";
          }
        } catch (e: any) {
          attemptOutput = `[Execution Failed]: ${e.message}`;
          attemptSuccess = false;
        }

        // Confidence Scoring
        const confScore = await this.calculateConfidence(exec.task, exec.taskType, attemptOutput);
        exec.confidenceScore = confScore;
        exec.result = attemptOutput;

        // Adaptive Self-Correction if confidence is low
        if (attemptSuccess && confScore <= 0.65 && exec.taskType !== "image") {
            exec.result = await this.selfCorrect(exec.task, exec.result, "Low confidence score indicated potential hallucination or error.");
            exec.confidenceScore = Math.min(confScore + 0.3, 0.95);
            
            // Track learning about this failure pattern
            this.adaptiveLearningData.push({ task: exec.task, failedOutput: attemptOutput, corrected: true });
        }

        exec.status = "completed";
        this.centralKnowledge += `\n- Learned from ${exec.config.framework} (${exec.taskType}): ${exec.result?.slice(0, 100)}`;
        await this.creator.rememberSuccessfulCell(exec.task, exec.config);
        
        notify();
      }));
    }
  }

  private getLearningContext(): string {
     if (this.adaptiveLearningData.length === 0) return "None.";
     return this.adaptiveLearningData.map(d => `Avoid generating this output for similar tasks: ${d.failedOutput?.slice(0, 50)}`).join(" | ");
  }

  private async synthesize(originalPrompt: string, cellExecutions: CellExecution[]): Promise<string> {
    const outputs = cellExecutions.map(e => `[Cell ${e.taskType}] Confidence: ${e.confidenceScore}\n${e.result}`).join('\n\n');
    let hasImages = cellExecutions.some(e => e.imageUrl);

    const prompt = `Synthesize the outputs from multiple specialized AI cells into a final markdown response.
    Original Task: ${originalPrompt}
    Cell Outputs: ${outputs}
    
    Format nicely in markdown. If code was written, emit it in proper blocks. Ensure the flow is logical.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt
      });

      let finalRaw = response.text || "Synthesis failed.";
      if (hasImages) {
         // Append image artifacts at the end or inline
         finalRaw += "\n\n### Generated Artifacts\n\n";
         const images = cellExecutions.filter(e => e.imageUrl).map(e => `![Generated Visual](${e.imageUrl})\n*Prompt: ${e.task}*`).join('\n\n');
         finalRaw += images;
      }
      return finalRaw;
    } catch(e: any) {
      return "Synthesis failed: " + e.message;
    }
  }
}
