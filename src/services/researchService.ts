import { GoogleGenAI } from "@google/genai";

export class ResearchService {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    this.ai = new GoogleGenAI({ apiKey: apiKey || (process as any).env.GEMINI_API_KEY });
  }

  /**
   * Performs extensive web search to gather context for a prompt
   */
  async gatherDeepContext(prompt: string): Promise<string> {
    console.log(`[Research Service] Initiating deep crawl for context: "${prompt.slice(0, 30)}..."`);
    
    try {
      // Using Gemini 3 Flash with googleSearch tool for real-time grounding
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Research the following request extensively to provide all necessary context, documentation, and technical constraints required for an AI agent to perfectly execute it: ${prompt}`,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: {
            includeServerSideToolInvocations: true,
            include_server_side_tool_invocations: true,
            functionCallingConfig: {
              mode: 'AUTO'
            }
          } as any,
          systemInstruction: "You are a professional research agent. Your goal is to provide deep, factual, and technical context from the live web to support complex task execution."
        }
      });

      return response.text || "No extra context found.";
    } catch (error) {
      console.error("[Research Service] Error during deep context gathering:", error);
      return "Context gathering failed. Proceeding with internal knowledge.";
    }
  }

  /**
   * Summarizes and chunks long context into actionable 'todos'
   */
  async chunkContext(deepContext: string): Promise<string[]> {
     try {
       const response = await this.ai.models.generateContent({
         model: "gemini-3-flash-preview",
         contents: `Break down the following extensive context into a list of atomic, actionable tasks (TODOs). Each task should be independent and clear enough for a specialized AI agent to handle: \n\n ${deepContext}`,
         config: {
           responseMimeType: "application/json",
         }
       });

       // We expect a JSON array of strings
       const tasks = JSON.parse(response.text || "[]");
       return Array.isArray(tasks) ? tasks : [deepContext.slice(0, 500)];
     } catch (error) {
       console.error("[Research Service] Chunking failed:", error);
       return ["Execute main task based on provided context."];
     }
  }
}
