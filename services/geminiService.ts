
import { GoogleGenAI, Type } from "@google/genai";
import { NLUData, NLUFrame, NLUFrameRole, GlobalConfig } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJSONResponse = (text: string): string => {
  if (!text) return '{}';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json|svg|xml)?\s*/i, '').replace(/\s*```$/i, '').trim();
  
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  let start = -1;
  let end = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }
  
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  
  return cleaned;
};

export const generateNLU = async (utterance: string): Promise<NLUData> => {
  const ai = getAI();
  const systemInstruction = `You are a MediaFranca Semanticist. Generate a formal NLU JSON for the given UTTERANCE.
  Detect the language and ensure the schema is strictly followed. 
  "roles" inside frames MUST be an ARRAY of objects where each object has a "role_name" key.
  Return ONLY strictly valid JSON.`;
  
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
            properties: { 
              speech_act: { type: Type.STRING }, 
              intent: { type: Type.STRING } 
            },
            required: ["speech_act", "intent"]
          },
          frames: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                frame_name: { type: Type.STRING },
                lexical_unit: { type: Type.STRING },
                roles: { 
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      role_name: { type: Type.STRING },
                      type: { type: Type.STRING },
                      surface: { type: Type.STRING },
                      lemma: { type: Type.STRING },
                      definiteness: { type: Type.STRING },
                      ref: { type: Type.STRING },
                      ref_frame: { type: Type.STRING }
                    },
                    required: ["role_name", "type", "surface"]
                  }
                }
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

  const rawJson = JSON.parse(cleanJSONResponse(response.text));
  if (rawJson.frames && Array.isArray(rawJson.frames)) {
    rawJson.frames = rawJson.frames.map((frame: any) => {
      const rolesRecord: Record<string, NLUFrameRole> = {};
      if (Array.isArray(frame.roles)) {
        frame.roles.forEach((r: any) => {
          const { role_name, ...rest } = r;
          if (role_name) rolesRecord[role_name] = rest;
        });
      }
      return { ...frame, roles: rolesRecord };
    });
  }
  return rawJson as NLUData;
};

export const generateVisualBlueprint = async (nlu: NLUData): Promise<{ visualBlocks: string; prompt: string }> => {
  const ai = getAI();
  const systemInstruction = `You are a Visual Architect. Translate NLU semantics into a visual structure.
  CRITICAL: You MUST map the Lexical Units and Frames from the NLU to specific SVG IDs.
  "visualBlocks" must be a comma-separated list of IDs (e.g. "#agent_person, #theme_object").
  "prompt" describes how to draw these blocks to represent the core action defined in the NLU frames.
  Return ONLY strictly valid JSON.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `NLU Data: ${JSON.stringify(nlu)}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualBlocks: { type: Type.STRING },
          prompt: { type: Type.STRING }
        },
        required: ["visualBlocks", "prompt"]
      }
    }
  });

  return JSON.parse(cleanJSONResponse(response.text));
};

export const generateSVG = async (visualBlocks: string, prompt: string, row: any, config: GlobalConfig): Promise<string> => {
  const ai = getAI();
  const nluData = typeof row.nlu === 'object' ? row.nlu : JSON.parse(row.nlu || '{}');
  
  const systemInstruction = `You are an SVG Engineer expert. 
  CRITICAL CASCADE RULE: You MUST use the NLU and the Visual Blueprint as the source of truth.
  1. Use the utterance: "${row.text}".
  2. The SVG <metadata> MUST include the Lexical Units and Frames found in the NLU JSON: ${JSON.stringify(nluData)}.
  3. Every graphical group <g> MUST have an id that matches the IDs listed in the Visual Blueprint: ${visualBlocks}.
  4. Follow the PictoNet standard for styling (.f for fills, .k for strokes).
  5. The output MUST be a valid 100x100 SVG.
  6. Ensure the 'title' and 'desc' tags are descriptive of the action described in the NLU.
  
  Return ONLY the raw <svg> tag. No conversational text.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `STRATEGY: ${prompt}. Generate the high-fidelity semantic SVG following the strict metadata requirements.`,
    config: { systemInstruction }
  });

  const text = response.text || '';
  const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) return svgMatch[0];
  
  return cleanJSONResponse(text);
};
