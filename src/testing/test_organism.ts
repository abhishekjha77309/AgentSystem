import { EventEmitter } from 'events';

// Simulated Bloodstream (Central Orchestrator Bus)
const bloodstream = new EventEmitter();
const db = {
    cells: new Map<string, any>(),
    tasks: new Map<string, any>()
};

async function simulateVMCell(vmName: string) {
    console.log(`[${vmName}] Booting OpenClaw VM Wrapper...`);
    
    const cellId = `cell_${Math.random().toString(36).substr(2, 9)}`;
    db.cells.set(cellId, {
        name: vmName,
        type: 'cloud_vm',
        status: 'idle',
        load: 20,
        lastHeartbeat: Date.now()
    });
    console.log(`[${vmName}] Registered to Organism Bloodstream with ID: ${cellId}`);

    let isOffline = false;

    // Listen for new tasks
    const onNewTask = async (task: any, taskId: string) => {
        if (isOffline) return;
        
        // Ensure atomic claim (simulating transaction)
        const currentTask = db.tasks.get(taskId);
        if (currentTask && currentTask.status === 'pending') {
            currentTask.status = 'working';
            currentTask.assignedTo = cellId;
            db.tasks.set(taskId, currentTask);
            bloodstream.emit('task_update', taskId);

            console.log(`[${vmName}] Detected new task: "${task.prompt}". Claiming...`);
            
            // Simulate working / Optimization / Hallucination check
            let temperature = 0.7;
            let success = false;
            let retries = 0;
            let result = "";

            while (!success && retries < 3) {
                console.log(`[${vmName}] Processing... (Temp: ${Math.round(temperature*100)/100}, Attempt: ${retries + 1})`);
                await new Promise(r => setTimeout(r, 600)); // Simulate async model inference
                
                // Simulate hallucination logic
                const hallucinated = Math.random() > 0.5; // 50% chance to "hallucinate" for simulation
                
                if (hallucinated && retries < 2) {
                    console.log(`[${vmName}] Self-Correction Triggered: Hallucination detected in output. Lowering temperature and retrying.`);
                    temperature = Math.max(0.1, temperature - 0.3);
                    retries++;
                } else {
                    success = true;
                    result = `[${vmName}] Successfully completed task at temp ${Math.round(temperature*100)/100}.`;
                }
            }

            console.log(`[${vmName}] Task complete. Result: ${result}`);
            const finalTask = db.tasks.get(taskId);
            finalTask.status = 'completed';
            finalTask.result = result;
            finalTask.completedAt = Date.now();
            db.tasks.set(taskId, finalTask);
            bloodstream.emit('task_update', taskId);
        }
    };
    
    bloodstream.on('new_task', onNewTask);

    // Heartbeat
    const hbInterval = setInterval(() => {
        if(!isOffline) {
            const c = db.cells.get(cellId);
            if(c) c.lastHeartbeat = Date.now();
        }
    }, 2000);

    return {
        id: cellId,
        shutdown: async () => {
            isOffline = true;
            clearInterval(hbInterval);
            bloodstream.removeListener('new_task', onNewTask);
            db.cells.delete(cellId);
            console.log(`[${vmName}] Shutting down to save cloud costs.`);
        }
    };
}

async function runTest() {
    console.log("=== STARTING DIGITAL ORGANISM TEST ===");
    
    // 1. Spin up 2 Cloud VMs (Node simulated versions of OpenClaw cells)
    const vm1 = await simulateVMCell('Cloud-VM-Alpha');
    const vm2 = await simulateVMCell('Cloud-VM-Beta');

    await new Promise(r => setTimeout(r, 1000));

    // 2. Orchestrator (Brain) pushes tasks into the bloodstream
    console.log("[Orchestrator] Dispatching tasks to Bloodstream...");
    const task1Id = "t_01";
    const task2Id = "t_02";
    
    db.tasks.set(task1Id, { prompt: 'Analyze log anomalies in sector 7G', status: 'pending' });
    db.tasks.set(task2Id, { prompt: 'Synthesize optimal hyper-parameters for LiteRT', status: 'pending' });
    
    bloodstream.emit('new_task', db.tasks.get(task1Id), task1Id);
    bloodstream.emit('new_task', db.tasks.get(task2Id), task2Id);

    // 3. Wait for VMs to process
    console.log("[Orchestrator] Monitoring task status...");
    
    await new Promise<void>((resolve) => {
        const checkStatus = () => {
            const t1 = db.tasks.get(task1Id);
            const t2 = db.tasks.get(task2Id);
            if (t1.status === 'completed' && t2.status === 'completed') {
                bloodstream.removeListener('task_update', checkStatus);
                resolve();
            }
        };
        bloodstream.on('task_update', checkStatus);
    });

    // 4. Shutdown VMs to stop bills
    console.log("[Orchestrator] Test cycle complete. Shutting down VMs.");
    await vm1.shutdown();
    await vm2.shutdown();
    console.log("=== DIGITAL ORGANISM TEST COMPLETE ===");
}

runTest().catch(console.error);
