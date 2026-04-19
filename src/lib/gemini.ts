import { GoogleGenAI, Modality, ThinkingLevel, Type, FunctionDeclaration } from '@google/genai';

let customApiKey: string | null = null;

export const setCustomApiKey = (key: string) => {
  customApiKey = key;
};

export const getAI = () => {
  // Use custom key if provided by user (for preview/paid models) or fallback to env injected key
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing. Please add an API key in settings.");
  return new GoogleGenAI({ apiKey });
};

// Available features map
export const MODELS = {
  chatFlash: 'gemini-3-flash-preview',
  chatPro: 'gemini-3.1-pro-preview',
  lowLatency: 'gemini-3.1-flash-lite-preview',
  imageCreateFast: 'gemini-2.5-flash-image',
  imageCreatePro: 'gemini-3.1-flash-image-preview',
  videoLite: 'veo-3.1-lite-generate-preview',
  videoPro: 'veo-3.1-generate-preview', // Needs API Key
  tts: 'gemini-3.1-flash-tts-preview',
  live: 'gemini-3.1-flash-live-preview',
  lyriaClip: 'lyria-3-clip-preview', // Needs API Key
  lyriaPro: 'lyria-3-pro-preview' // Needs API Key
};

// Unified Agent tool wrapper
export const createAgentChat = (modelName: string, systemInstruction: string, tools?: any[]) => {
  const ai = getAI();
  return ai.chats.create({
    model: modelName,
    config: { 
      systemInstruction,
      tools: tools && tools.length > 0 ? tools : undefined,
      toolConfig: tools && tools.length > 0 ? {
        includeServerSideToolInvocations: true,
        include_server_side_tool_invocations: true,
        functionCallingConfig: {
          mode: 'AUTO'
        }
      } as any : undefined
    }
  });
};

export const TERMINAL_TOOL: FunctionDeclaration = {
  name: "execute_terminal_command",
  description: "Executes a shell command in the Antigravity IDE environment. Use this to run builds (gradle, npm), search files, or manage the project structure.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description: "The shell command to execute (e.g., 'ls -la', 'npm install', 'gradle assembleDebug')"
      }
    },
    required: ["command"]
  }
};

export const FILESYSTEM_TOOL: FunctionDeclaration = {
  name: "filesystem_operation",
  description: "Directly performs CRUD operations on the local filesystem. Use this for precise file reads, writes, and deletions without shell overhead.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      operation: {
        type: Type.STRING,
        enum: ["READ", "WRITE", "DELETE", "LIST", "EXISTS"],
        description: "The filesystem operation to perform."
      },
      path: {
        type: Type.STRING,
        description: "The relative path to the file or directory."
      },
      content: {
        type: Type.STRING,
        description: "Optional content for WRITE operations."
      }
    },
    required: ["operation", "path"]
  }
};

export const generateImage = async (prompt: string, model: string = MODELS.imageCreateFast, aspectRatio = '16:9') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      imageConfig: { aspectRatio, imageSize: '1K' }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateVideo = async (prompt: string) => {
  const ai = getAI();
  // Using veo-3.1-lite-generate-preview for fast generation without requiring paid key, 
  // but if user places a key, we can use veo-3.1-fast-generate-preview or generate-preview.
  let operation = await ai.models.generateVideos({
    model: MODELS.videoLite,
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });
  
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 5000));
    operation = await ai.operations.getVideosOperation({operation});
  }
  return operation.response?.generatedVideos?.[0]?.video?.uri;
};

export const generateTTS = async (text: string, voice = 'Zephyr') => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.tts,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
    }
  });
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return data ? `data:audio/pcm;base64,${data}` : null;
};

export const generateMusic = async (prompt: string, isFullLength = false) => {
  const ai = getAI();
  const response = await ai.models.generateContentStream({
    model: isFullLength ? MODELS.lyriaPro : MODELS.lyriaClip,
    contents: prompt
  });

  let audioBase64 = "";
  let mimeType = "audio/wav";

  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if (part.inlineData?.data) {
        if (!audioBase64 && part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
        audioBase64 += part.inlineData.data;
      }
    }
  }
  return `data:${mimeType};base64,${audioBase64}`;
};
