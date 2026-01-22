
import { GoogleGenAI, Type } from "@google/genai";
import { NLUData } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * PHASE 1: Generate NLU from UTTERANCE
 */
export const generateNLU = async (utterance: string): Promise<NLUData> => {
  const ai = getAI();
  const systemInstruction = `You are a MediaFranca Semanticist. Generate a formal NLU JSON for the given UTTERANCE.
  Detect the language and ensure the schema is strictly followed.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `UTTERANCE: "${utterance}"`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          utterance: { type: Type.STRING },
          lang: { type: Type.STRING },
          metadata: {
            type: Type.OBJECT,
            properties: { speech_act: { type: Type.STRING }, intent: { type: Type.STRING } },
            required: ["speech_act", "intent"]
          },
          frames: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                frame_name: { type: Type.STRING },
                lexical_unit: { type: Type.STRING },
                roles: { type: Type.OBJECT }
              },
              required: ["frame_name", "lexical_unit", "roles"]
            }
          },
          visual_guidelines: {
            type: Type.OBJECT,
            properties: {
              focus_actor: { type: Type.STRING },
              action_core: { type: Type.STRING },
              object_core: { type: Type.STRING },
              context: { type: Type.STRING },
              temporal: { type: Type.STRING }
            },
            required: ["focus_actor", "action_core", "object_core", "context", "temporal"]
          }
        },
        required: ["utterance", "lang", "metadata", "frames", "visual_guidelines"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

/**
 * PHASE 2: Generate VISUAL-BLOCKS and PROMPT from NLU
 */
export const generateVisualBlueprint = async (nlu: NLUData): Promise<{ visualBlocks: string; prompt: string }> => {
  const ai = getAI();
  const systemInstruction = `You are a Visual Architect. Create VISUAL-BLOCKS (hierarchical SVG IDs) and a design PROMPT from NLU data.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `NLU: ${JSON.stringify(nlu)}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualBlocks: { type: Type.STRING, description: "SVG group IDs list" },
          prompt: { type: Type.STRING, description: "Design strategy prompt" }
        },
        required: ["visualBlocks", "prompt"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

/**
 * PHASE 3: Generate SVG from VISUAL-BLOCKS and PROMPT
 */
export const generateSVG = async (visualBlocks: string, prompt: string, utterance: string): Promise<string> => {
  const ai = getAI();
  const systemInstruction = `You are an SVG Engineer. Create a 100x100 semantic SVG. 
  Use .f for fill, .k for stroke. Return ONLY raw SVG code.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `UTTERANCE: "${utterance}". VISUAL-BLOCKS: ${visualBlocks}. PROMPT: ${prompt}.`,
    config: { systemInstruction }
  });

  return response.text || '';
};
