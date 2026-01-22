
import { GoogleGenAI, Type } from "@google/genai";
import { NLUData, NLUFrame, NLUFrameRole, GlobalConfig, RowData } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJSONResponse = (text: string): string => {
  if (!text) return '{}';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json|svg|xml)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  let start = -1; let end = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace; end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket; end = lastBracket;
  }
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned;
};

export const generateNLU = async (utterance: string): Promise<NLUData> => {
  const ai = getAI();
  const systemInstruction = `You are a MediaFranca Semanticist. 
  Generate a formal NLU JSON for the given UTTERANCE.
  CRITICAL: The NLU schema (intents, frames, guidelines) MUST ALWAYS BE IN ENGLISH (Strict EN-US).
  Follow the MediaFranca PictoNet standard for NLU structure.
  Return only valid JSON.`;
  
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

export const generateVisualBlueprint = async (nlu: NLUData, lang: string): Promise<Partial<RowData>> => {
  const ai = getAI();
  const systemInstruction = `You are a Visual Architect for PictoNet. Translate NLU semantics into a visual pictogram structure.

  REGLAS DE BLOQUES VISUALES (VISUAL-BLOCKS):
  1. NO USAR VERBOS. Los IDs deben ser sustantivos o componentes físicos (ej. NO "#running", SÍ "#legs_extended, #motion_lines").
  2. INCORPORA VISUAL BLENDS: Si hay movimiento, añade "#motion_lines". Si hay foco, "#focus_indicator". Si hay deseo, "#heart_symbol" o similares.
  3. ESTRUCTURA: Lista de IDs separados por comas empezando con #.
  
  REGLAS DE PROMPT:
  1. Debe estar en ${lang}.
  2. Describe la composición espacial: ¿dónde está el actor? ¿dónde el objeto? ¿qué "visual blends" se usan para representar la acción?
  
  Return valid JSON only with keys "VISUAL-BLOCKS" and "PROMPT".`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `NLU Data: ${JSON.stringify(nlu)}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          "VISUAL-BLOCKS": { type: Type.STRING },
          PROMPT: { type: Type.STRING }
        },
        required: ["VISUAL-BLOCKS", "PROMPT"]
      }
    }
  });

  return JSON.parse(cleanJSONResponse(response.text));
};

export const generateSVG = async (visualBlocks: string, prompt: string, row: any, config: GlobalConfig): Promise<string> => {
  const ai = getAI();
  const systemInstruction = `You are a professional SVG Engineer for PictoNet.
  
  CRITICAL STYLING RULES:
  - Class .f: FILL WHITE (#fff), STROKE BLACK (#000). Use for solid objects.
  - Class .k: FILL BLACK (#000), STROKE WHITE (#fff). Use for high-contrast or human figures.
  - VISUAL BLENDS (Líneas de movimiento, auras): Represent them using clean, minimalist strokes (stroke-width: 2px typical).
  
  INTEGRATION:
  Interpret the requested Visual Blocks [${visualBlocks}] and the Strategy [${prompt}].
  Ensure the SVG is semantic, uses <g> with IDs, and provides accessibility tags in ${config.lang}.
  Output raw <svg> only, 100x100 viewport.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Strategy: ${prompt}. Required Visual Elements: ${visualBlocks}. Create the final PictoNet SVG.`,
    config: { systemInstruction }
  });

  const text = response.text || '';
  const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) return svgMatch[0];
  return cleanJSONResponse(text);
};
