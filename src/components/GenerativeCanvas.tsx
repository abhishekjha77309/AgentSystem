import React, { useState, useRef } from "react";
import { Image as ImageIcon, Video, Code2, Loader2, Sparkles, Download, BarChart2 } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

type CanvasMode = 'image' | 'video' | 'dataviz';

export const GenerativeCanvas: React.FC = () => {
    const [mode, setMode] = useState<CanvasMode>('image');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Results
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const checkAndInitGenAI = async () => {
       setErrorMsg(null);
       let apiKey = process.env.GEMINI_API_KEY;
       if (mode === 'image' || mode === 'video') {
         // The prompt wants specific key handling for Veo and High-Res Images.
         // Let's use window.aistudio if available (handled via mock or actual env)
         if (typeof window !== 'undefined' && (window as any).aistudio) {
             const hasKey = await (window as any).aistudio.hasSelectedApiKey();
             if (!hasKey) {
                 await (window as any).aistudio.openSelectKey();
             }
         }
       }
       return new GoogleGenAI({ apiKey });
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setImageUrl(null);
        setVideoUrl(null);
        setChartData(null);
        setErrorMsg(null);

        try {
            const ai = await checkAndInitGenAI();
            
            if (mode === 'image') {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.1-flash-image-preview',
                  contents: { parts: [{ text: prompt }] },
                  config: {
                    imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
                  },
                });
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                  if (part.inlineData) {
                    const base64 = part.inlineData.data;
                    setImageUrl(`data:image/png;base64,${base64}`);
                  }
                }
            } 
            else if (mode === 'video') {
                let operation = await ai.models.generateVideos({
                  model: 'veo-3.1-lite-generate-preview',
                  prompt: prompt,
                  config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
                });
                
                while (!operation.done) {
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  operation = await ai.operations.getVideosOperation({operation: operation});
                }
                
                const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (uri) {
                    let apiKey = process.env.GEMINI_API_KEY || '';
                    if (typeof window !== 'undefined' && (window as any).aistudio) {
                       // Assume platform injects it or user chose it.
                    }
                    setVideoUrl(uri); // Usually requires auth header fetching, but we will attach it to video src if needed, or proxy it.
                } else {
                    setErrorMsg("Video generation failed or timed out.");
                }
            }
            else if (mode === 'dataviz') {
                const response = await ai.models.generateContent({
                  model: "gemini-3-flash-preview",
                  contents: `Generate realistic structured data array based on this prompt for a chart. Provide only the JSON array of objects. Prompt: ${prompt}`,
                  config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          value1: { type: Type.NUMBER },
                          value2: { type: Type.NUMBER }
                        },
                      },
                    },
                  },
                });
                
                const rawText = response.text || "[]";
                try {
                    const parsed = JSON.parse(rawText.trim());
                    setChartData({ type: 'bar', data: parsed });
                } catch(e) {
                     setErrorMsg("Failed to parse JSON data for visualization.");
                }
            }

        } catch (e: any) {
             setErrorMsg(e.message || "An error occurred during generation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

    return (
        <div className="flex flex-col h-full bg-neutral-950 text-neutral-300">
            {/* Toolbar */}
            <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 flex flex-wrap gap-3 items-center shrink-0">
                <Button 
                    variant={mode === 'image' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setMode('image')}
                    className={mode === 'image' ? "bg-indigo-600 hover:bg-indigo-500" : "bg-neutral-800 border-neutral-700"}
                >
                    <ImageIcon className="w-4 h-4 mr-2" /> Image Gen
                </Button>
                <Button 
                    variant={mode === 'video' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setMode('video')}
                    className={mode === 'video' ? "bg-indigo-600 hover:bg-indigo-500" : "bg-neutral-800 border-neutral-700"}
                >
                    <Video className="w-4 h-4 mr-2" /> Video Gen
                </Button>
                <Button 
                    variant={mode === 'dataviz' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setMode('dataviz')}
                    className={mode === 'dataviz' ? "bg-emerald-600 hover:bg-emerald-500" : "bg-neutral-800 border-neutral-700"}
                >
                    <BarChart2 className="w-4 h-4 mr-2" /> Data Viz
                </Button>
            </div>

            <div className="flex flex-col flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    {/* Prompt Box */}
                    <div className="space-y-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            {mode === 'image' && 'Image Generation Canvas (3.1 Flash)'}
                            {mode === 'video' && 'Video Generation Canvas (Veo 3.1)'}
                            {mode === 'dataviz' && 'Synthetic Visual Data (Recharts)'}
                        </h3>
                        <p className="text-neutral-400 text-sm">
                            {mode === 'image' && 'Prompt Gemini to construct high-fidelity images.'}
                            {mode === 'video' && 'Prompt Veo to create HD video sequences (this may take a few minutes).'}
                            {mode === 'dataviz' && 'Prompt Gemini to generate a dataset and instantly visualize it using Recharts.'}
                        </p>
                        <div className="flex gap-2 items-start mt-2">
                            <textarea 
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder={
                                    mode === 'image' ? "E.g. A neon hologram of a cat..." :
                                    mode === 'video' ? "E.g. A time lapse of a neon city building itself..." :
                                    "E.g. Monthly active users and revenue for a SaaS startup over a year."
                                }
                                className="flex-1 bg-black border border-neutral-700 rounded-lg p-3 text-sm text-white resize-none h-[100px] focus:outline-none focus:border-indigo-500 custom-scrollbar"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleGenerate} 
                                disabled={!prompt || isGenerating}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg"
                            >
                                {isGenerating ? (
                                    <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing... </>
                                ) : (
                                    'Generate Canvas'
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Results Container */}
                    <div className="min-h-[400px] border border-neutral-800 rounded-xl bg-neutral-900/50 flex items-center justify-center relative overflow-hidden">
                        {!isGenerating && !imageUrl && !videoUrl && !chartData && !errorMsg && (
                            <div className="text-center text-neutral-500 flex flex-col items-center p-8">
                                <Code2 className="w-12 h-12 mb-4 opacity-50" />
                                <p>Workspace awaiting input parameters.</p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="flex flex-col items-center animate-pulse p-8 relative z-10 w-full text-center">
                                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                                <p className="text-indigo-400 font-medium tracking-widest uppercase">
                                    {mode === 'video' ? "Orchestrating video frames (Standby...)" : "Synthesizing..."}
                                </p>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="text-red-400 bg-red-950/40 border border-red-900/50 p-4 rounded-lg m-4 max-w-lg text-center">
                                {errorMsg}
                            </div>
                        )}

                        {imageUrl && mode === 'image' && !isGenerating && (
                            <img src={imageUrl} alt="Generated" className="object-contain w-full h-full max-h-[600px] rounded-lg shadow-2xl" />
                        )}

                        {videoUrl && mode === 'video' && !isGenerating && (
                            // Use standard video tag. Video from URI from GenAI might need auth header, so we advise. 
                            <div className="flex flex-col items-center w-full p-4">
                                <video controls className="w-full max-w-3xl rounded-lg border border-neutral-800 shadow-2xl bg-black">
                                     <source src={videoUrl} type="video/mp4" />
                                     Your browser does not support the video tag.
                                </video>
                                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm">
                                    <Download className="w-4 h-4"/> Open Raw Video Source URL
                                </a>
                                <p className="text-xs text-neutral-500 mt-2 text-center">Note: Video URIs may inherently require GCP authenticated headers if previewed outside proper scopes.</p>
                            </div>
                        )}

                        {chartData && mode === 'dataviz' && !isGenerating && (
                            <div className="w-full h-[400px] p-6 bg-neutral-900 rounded-xl relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="name" stroke="#888" />
                                        <YAxis stroke="#888" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }}
                                            itemStyle={{ color: '#e5e5e5' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="value1" fill="#10b981" radius={[4, 4, 0, 0]} name="Metric A" />
                                        {chartData.data[0]?.value2 !== undefined && (
                                           <Bar dataKey="value2" fill="#6366f1" radius={[4, 4, 0, 0]} name="Metric B" />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
