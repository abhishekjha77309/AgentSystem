import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAI, MODELS } from '../lib/gemini';
import { Modality } from '@google/genai';

export function LiveVoiceModal({ onClose }: { onClose: () => void }) {
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [transcript, setTranscript] = useState<string[]>([]);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    initLiveSession();
    return () => {
      cleanup();
    };
  }, []);

  const initLiveSession = async () => {
    try {
      const ai = getAI();
      const sessionPromise = ai.live.connect({
        model: MODELS.live,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } } },
          systemInstruction: "You are the Antigravity voice assistant. Be highly efficient and creative.",
          outputAudioTranscription: {}, 
          inputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: async () => {
            setIsInitializing(false);
            setIsActive(true);
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaStreamRef.current = stream;
              const ctx = new AudioContext({ sampleRate: 16000 });
              audioContextRef.current = ctx;
              const source = ctx.createMediaStreamSource(stream);
              const processor = ctx.createScriptProcessor(4096, 1, 1);
              
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  let s = Math.max(-1, Math.min(1, inputData[i]));
                  pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                // Convert to base64
                const bytes = new Uint8Array(pcm16.buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const base64Data = btoa(binary);
                
                sessionPromise.then(session => {
                  session.sendRealtimeInput({
                    audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                  });
                });
              };
              
              source.connect(processor);
              processor.connect(ctx.destination);
            } catch (err) {
              console.error("Audio init error", err);
            }
          },
          onmessage: async (message: any) => {
            // Transcript
            const inputT = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (inputT) setTranscript(prev => [...prev, `AI: ${inputT}`]);

            // Audio output playback (simplified PCM handling)
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
               const binary = atob(base64Audio);
               const len = binary.length;
               const bytes = new Uint8Array(len);
               for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
               const pcm16 = new Int16Array(bytes.buffer);
               
               const ab = audioContextRef.current.createBuffer(1, pcm16.length, 24000); // Live usually outputs 24000Hz
               const channelData = ab.getChannelData(0);
               for (let i = 0; i < pcm16.length; i++) {
                 channelData[i] = pcm16[i] / 32768; 
               }
               
               const source = audioContextRef.current.createBufferSource();
               source.buffer = ab;
               source.connect(audioContextRef.current.destination);
               source.start();
            }
          },
          onerror: (err: any) => console.error("Live err", err),
          onclose: () => setIsActive(false),
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e: any) {
      console.error(e);
      setTranscript(prev => [...prev, `Error: ${e.message}`]);
      setIsInitializing(false);
    }
  };

  const cleanup = () => {
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (sessionRef.current) sessionRef.current.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden shadow-2xl">
        <Button variant="ghost" size="icon" onClick={() => { cleanup(); onClose(); }} className="absolute top-4 right-4 rounded-full text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
        
        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Vocal Orchestrator</h2>
          <p className="text-neutral-500 font-mono text-sm mt-2">Gemini 3.1 Flash Live</p>
        </div>

        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          {isInitializing ? (
             <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
          ) : isActive ? (
             <>
               <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
               <div className="absolute inset-4 bg-emerald-500/40 rounded-full animate-pulse" />
             </>
          ) : null}
          <div className={`w-20 h-20 rounded-full z-10 flex items-center justify-center transition-colors shadow-lg ${isActive ? 'bg-emerald-500 shadow-emerald-500/50' : isInitializing ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-neutral-800'}`}>
             {isInitializing ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : isActive ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-neutral-500" />}
          </div>
        </div>

        <div className="w-full h-32 bg-neutral-950 rounded-xl border border-neutral-800 p-4 overflow-y-auto space-y-2">
           {transcript.length === 0 && <div className="text-center text-neutral-600 italic mt-8">Listening...</div>}
           {transcript.map((t, idx) => <div key={idx} className="text-sm font-mono text-neutral-300">{t}</div>)}
        </div>
      </div>
    </div>
  );
}
