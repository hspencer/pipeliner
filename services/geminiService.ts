
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
  const systemInstruction = `You are an expert in Visual Communication and Cognitive Accessibility. 
  Your task is to generate a high-fidelity MediaFranca NLU JSON for the given UTTERANCE.
  The goal is to provide clear semantic anchors for a future pictogram.
  CRITICAL: All keys and values in the JSON (intents, frames, guidelines) MUST BE IN ENGLISH.
  Follow strict cognitive accessibility standards: reduce ambiguity, highlight the core action and agents.`;
  
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
  const systemInstruction = `You are a Senior Visual Communication Strategist specializing in Cognitive Accessibility and ISO visual standards.
  Your goal is to define the visual structure for a universal pictogram.

  REGLAS DE BLOQUES VISUALES (VISUAL-BLOCKS):
  1. Utiliza IDs de elementos sustantivos puros (NO incluyas el signo #). 
  2. Ejemplos correctos: "person", "water_glass", "motion_lines", "focus_aura".
  3. No uses verbos conjugados como IDs.
  
  REGLAS DE PROMPT:
  1. Debe estar redactado en ${lang}.
  2. DEBES incluir los IDs de los bloques visuales seleccionados en el texto.
  3. Describe meticulosamente la ARTICULACIÓN ESPACIAL: posición relativa de los elementos, proporciones y cómo se conectan para representar la acción semántica.
  4. Sigue principios de diseño para baja carga cognitiva: simplicidad, eliminación de ruido visual y jerarquía clara.

  Return valid JSON only with keys "VISUAL-BLOCKS" and "PROMPT".`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `NLU Semantics: ${JSON.stringify(nlu)}`,
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
  const systemInstruction = `You are a Master SVG Architect and Accessibility Engineer.
  Create a professional, high-fidelity pictogram following ISO 7001 (Public Information Symbols) and ISO 9186.

  TECHNICAL CONSTRAINTS:
  - Viewport: ${config.width}x${config.height}.
  - Attributes: xmlns="http://www.w3.org/2000/svg", viewBox="0 0 ${config.width} ${config.height}".
  - Styling:
    * Use class="f" for white fill/black stroke elements (solid objects).
    * Use class="k" for black fill/white stroke elements (human figures, emphasis).
    * Keep stroke-width relative and clean (approx 2px to 4px).
  - Structure: Use <g> groups for logical elements with IDs matching the requested Visual Blocks.
  - Accessibility: Include <title> and <desc> in ${config.lang} inside the SVG.

  DESIGN STRATEGY:
  ${prompt}
  Visual Elements to implement: ${visualBlocks}.

  Output the raw <svg> string only.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Execute SVG construction for: ${row.UTTERANCE}. Dimensions: ${config.width}x${config.height}.`,
    config: { systemInstruction }
  });

  const text = response.text || '';
  const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) return svgMatch[0];
  return cleanJSONResponse(text);
};
