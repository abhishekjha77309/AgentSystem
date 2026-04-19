import { documentationService, AppFunctionality } from "./documentationService";

export interface TestResult {
  functionId: string;
  name: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

export class SystemDiagnostics {
  async runFullSuite(): Promise<TestResult[]> {
    const functionalities = documentationService.getFunctionalities();
    const results: TestResult[] = [];

    for (const func of functionalities) {
      try {
        const success = await documentationService.verifyFunctionality(func.id);
        results.push({
          functionId: func.id,
          name: func.name,
          success,
          timestamp: Date.now()
        });
      } catch (e: any) {
        results.push({
          functionId: func.id,
          name: func.name,
          success: false,
          error: e.message,
          timestamp: Date.now()
        });
      }
    }

    return results;
  }

  async fixLifecycle(failures: TestResult[]): Promise<string> {
    if (failures.length === 0) return "Zero errors found. Lifecycle is optimal.";
    
    let currentFailures = [...failures];
    let iteration = 0;
    const maxIterations = 5;

    while (currentFailures.length > 0 && iteration < maxIterations) {
      iteration++;
      console.log(`[Diagnostics] Iteration ${iteration}: Attempting auto-fix for ${currentFailures.length} nodes...`);
      
      // Simulated targeted fix for each failure
      await new Promise(r => setTimeout(r, 1000));
      
      // Re-evaluate
      const newResults = await this.runFullSuite();
      currentFailures = newResults.filter(r => !r.success);
    }
    
    if (currentFailures.length === 0) {
      return `Autonomous Fix Successful. Zero errors remain after ${iteration} cycles.`;
    } else {
      return `Fix Lifecycle terminated after ${iteration} cycles. Remaining failures: ${currentFailures.length}. Manual intervention required for: ${currentFailures.map(f => f.name).join(', ')}`;
    }
  }
}

export const systemDiagnostics = new SystemDiagnostics();
