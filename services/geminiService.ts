
import { GoogleGenAI, Type } from "@google/genai";
import { NLUData, NLUFrame, NLUFrameRole, GlobalConfig } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJSONResponse = (text: string): string => {
  if (!text) return '{}';
  let cleaned = text.trim();
  // Strip markdown code blocks if they exist
  cleaned = cleaned.replace(/^```(?:json|svg|xml)?\s*/i, '').replace(/\s*```$/i, '').trim();
  
  // If we're looking for JSON (used in NLU and Visual Blueprint)
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  let start = -1;
  let end = -1;
  
  // Basic heuristic: find the outer-most JSON structure
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }
  
  if (start !== -1 && end !== -1 && end > start) {
    // Return only the JSON part
    return cleaned.substring(start, end + 1);
  }
  
  return cleaned;
};

/**
 * PHASE 1: Generate NLU from UTTERANCE
 */
export const generateNLU = async (utterance: string): Promise<NLUData> => {
  const ai = getAI();
  const systemInstruction = `You are a MediaFranca Semanticist. Generate a formal NLU JSON for the given UTTERANCE.
  Detect the language and ensure the schema is strictly followed. 
  "roles" inside frames MUST be an ARRAY of objects where each object has a "role_name" key.
  Return ONLY strictly valid JSON. No preamble, no postamble.`;
  
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
  
  // Transform roles from Array to Record for internal app state
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

/**
 * PHASE 2: Generate VISUAL-BLOCKS and PROMPT from NLU
 */
export const generateVisualBlueprint = async (nlu: NLUData): Promise<{ visualBlocks: string; prompt: string }> => {
  const ai = getAI();
  const systemInstruction = `You are a Visual Architect. Create a layout strategy from NLU data.
  "visualBlocks" must be a comma-separated list of meaningful SVG IDs (e.g. "#human_body, #water_glass").
  "prompt" is a technical drawing strategy for the SVG.
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

/**
 * PHASE 3: Generate SVG from VISUAL-BLOCKS and PROMPT
 */
export const generateSVG = async (visualBlocks: string, prompt: string, row: any, config: GlobalConfig): Promise<string> => {
  const ai = getAI();
  const nluData = typeof row.nlu === 'object' ? row.nlu : JSON.parse(row.nlu || '{}');
  const nluStr = JSON.stringify(nluData);
  
  const systemInstruction = `You are an SVG Engineer expert in semantic accessibility and the PictoNet standard. 
  Create a high-fidelity 100x100 semantic SVG pictogram for the utterance.
  
  MANDATORY STRUCTURE:
  1. Standard SVG root: id="pictogram", xmlns="http://www.w3.org/2000/svg", version="1.1", viewBox="0 0 100 100", role="img", class="hc", aria-labelledby="title desc", lang="${config.lang}", tabindex="0", focusable="true".
  2. <title id="title"> and <desc id="desc"> tags explaining the visual and its meaning.
  3. <metadata id="mf-accessibility"> containing a JSON-LD object following the PictoNet schema (utterance, nsm, concepts, accessibility, provenance).
  4. <defs> with internal <style>:
     - .f, .k { stroke-linejoin: round; stroke-width: 1ex; }
     - .f { fill: #fff; stroke: #000; }
     - .k { fill: #000; stroke: #fff; }
     - High contrast rules for svg.hc .f, svg.hc .k and .hc svg .f, .hc svg .k.
  5. Graphical content using <g> and <path> elements with IDs corresponding to the VISUAL-BLOCKS provided.
  6. A hidden <text> at x="-9999" y="-9999" with the utterance text.
  
  Use the provided prompt as a drawing strategy. Return ONLY the raw <svg> tag.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `UTTERANCE: "${row.text}". NLU: ${nluStr}. BLOCKS: ${visualBlocks}. STRATEGY: ${prompt}. CONFIG: ${JSON.stringify(config)}. Generate SVG:`,
    config: { systemInstruction }
  });

  // For SVG we want to extract the <svg ... </svg> tag specifically if there's noise
  const text = response.text || '';
  const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) return svgMatch[0];
  
  return cleanJSONResponse(text);
};
