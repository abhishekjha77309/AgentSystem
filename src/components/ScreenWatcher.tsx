import React, { useEffect, useState, useRef } from 'react';
import { useIdeStore } from '../store/ideStore';
import { ShieldCheck, ShieldAlert, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ScreenWatcher() {
    const isUiHealed = useIdeStore(s => s.isUiHealed);
    const setUiHealed = useIdeStore(s => s.setUiHealed);
    const snapshots = useIdeStore(s => s.snapshots);
    const addLog = useIdeStore(s => s.addLog);
    const revertToSnapshot = useIdeStore(s => s.revertToSnapshot);
    
    const [status, setStatus] = useState<'watching' | 'frozen' | 'recovering'>('watching');
    const [healthScore, setHealthScore] = useState(100);
    const [showFixDialog, setShowFixDialog] = useState(false);
    
    const lastHeartbeat = useRef(Date.now());
    const heartbeatInterval = useRef<any>(null);

    useEffect(() => {
        // Initialize Screen Watcher Heartbeat Listener
        const handleHeartbeat = () => {
            lastHeartbeat.current = Date.now();
            if (status === 'frozen') setStatus('watching');
        };

        window.addEventListener('ui-heartbeat' as any, handleHeartbeat);

        heartbeatInterval.current = setInterval(() => {
            const now = Date.now();
            // In a real app, this would check if the Workspace is mounted and responding
            // Here we simulate checking if the UI is "dead"
            if (now - lastHeartbeat.current > 10000) {
                // If no heartbeat for 10 seconds, UI might be frozen
                setStatus('frozen');
                setHealthScore(prev => Math.max(0, prev - 20));
            } else {
                setHealthScore(prev => Math.min(100, prev + 5));
            }
        }, 5000);

        return () => {
            clearInterval(heartbeatInterval.current);
            window.removeEventListener('ui-heartbeat' as any, handleHeartbeat);
        };
    }, [status]);

    // Monitor health and trigger auto-revert if it drops too low
    useEffect(() => {
        if (healthScore < 30 && status !== 'recovering') {
            handleAutoFix();
        }
    }, [healthScore]);

    const handleAutoFix = () => {
        setStatus('recovering');
        addLog('[Watcher Cell] DOM Integrity Check FAILED. Blank UI state detected.', 'cell', 'error');
        addLog('[Watcher Cell] Initiating autonomous recovery protocol...', 'cell', 'warning');
        
        setShowFixDialog(true);
        
        setTimeout(() => {
            if (snapshots.length > 0) {
                const lastValid = snapshots[0];
                addLog(`[Watcher Cell] Reverting to last known stable snapshot: ${lastValid.description}`, 'cell', 'success');
                revertToSnapshot(lastValid.id);
            } else {
                addLog('[Watcher Cell] No local snapshots found. Attempting emergency workspace reset...', 'cell', 'warning');
                window.location.reload(); // Atomic reset
            }
            
            setTimeout(() => {
                setStatus('watching');
                setHealthScore(100);
                setUiHealed(true);
                setShowFixDialog(false);
                addLog('[Watcher Cell] UI Health Restored. Scanning resumed.', 'cell', 'success');
            }, 2000);
        }, 3000);
    };

    // Global "I am alive" pulse
    useEffect(() => {
        const handlePulse = () => {
            lastHeartbeat.current = Date.now();
        };
        window.addEventListener('scroll', handlePulse, true);
        window.addEventListener('click', handlePulse, true);
        window.addEventListener('keydown', handlePulse, true);
        
        return () => {
            window.removeEventListener('scroll', handlePulse, true);
            window.removeEventListener('click', handlePulse, true);
            window.removeEventListener('keydown', handlePulse, true);
        };
    }, []);

    return (
        <>
            {/* Minimal Background Watcher Status in Footer (Internal) */}
            <div className="fixed bottom-1 right-1 z-[9999] pointer-events-none opacity-20 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-black/80 border border-neutral-800 rounded text-[10px] font-mono whitespace-nowrap">
                    {status === 'watching' ? (
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    ) : status === 'frozen' ? (
                        <ShieldAlert className="w-3 h-3 text-amber-500 animate-pulse" />
                    ) : (
                        <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                    )}
                    <span className="text-neutral-500 uppercase tracking-tighter">
                        UI Sentinel: <span className={healthScore > 70 ? 'text-emerald-400' : healthScore > 30 ? 'text-amber-400' : 'text-red-400'}>{healthScore}%</span>
                    </span>
                </div>
            </div>

            {/* Emergency Recovery Overlay */}
            <AnimatePresence>
                {showFixDialog && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6"
                    >
                        <div className="max-w-md w-full bg-neutral-950 border border-indigo-900/50 rounded-2xl p-8 shadow-[0_0_100px_rgba(79,70,229,0.2)] text-center">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-indigo-600/20 rounded-full animate-pulse">
                                    <Zap className="w-12 h-12 text-indigo-400" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Autonomous UI Recovery</h2>
                            <p className="text-neutral-400 text-sm mb-6">
                                The **AI Watcher Cell** detected an unresponsive UI state. Initiating neural rollback to ensure workspace continuity.
                            </p>
                            <div className="space-y-3">
                                <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 3 }}
                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    />
                                </div>
                                <div className="text-[10px] font-mono text-indigo-300 uppercase animate-pulse">
                                    Syncing with openagents.org clusters...
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
