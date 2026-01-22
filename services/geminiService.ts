
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { NLUData } from "../types";

export const generateNLUAndPrompt = async (spanish: string, english: string): Promise<{ nlu: NLUData; visualElements: string; imagePrompt: string; svgCode: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are a MediaFranca System Architect. Your mission is to generate a professional, semantic SVG Pictogram.
    
    You must produce 4 components:
    1. NLU JSON (MediaFranca Schema).
    2. Visual Elements List (Component hierarchy).
    3. Stylistic Prompt.
    4. SVG Source Code (The Single Source of Truth).

    SVG REQUIREMENTS:
    - Viewbox: "0 0 100 100".
    - Role: "img".
    - Metadata: Include a <metadata id="mf-accessibility"> tag containing a valid JSON object with the NLU info, utterance, and accessibility guidelines.
    - Styles: Define .f (light/fill) and .k (dark/stroke) classes with specific stroke-widths and colors (B&W).
    - Contrast: Support .hc class for High Contrast.
    - Paths: Generate clean, simple SVG <path> elements that visually represent the "Visual Elements" hierarchy. Use simple coordinates (0-100).
    - Hierarchy: Use <g> groups with IDs that match your Visual Elements list.

    THE OUTPUT MUST BE A SINGLE JSON OBJECT.
  `;

  const prompt = `
    Create a semantic SVG pictogram for the following concept:
    Spanish: "${spanish}"
    English: "${english}"

    Ensure the SVG paths are minimalist and represent the concept clearly in a 100x100 space.
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nlu: { 
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
                          surface: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              },
              nsm_explictations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    token: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  }
                }
              },
              logical_form: {
                type: Type.OBJECT,
                properties: {
                  event: { type: Type.STRING },
                  modality: { type: Type.STRING }
                }
              },
              pragmatics: {
                type: Type.OBJECT,
                properties: {
                  politeness: { type: Type.STRING },
                  formality: { type: Type.STRING },
                  expected_response: { type: Type.STRING }
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
                }
              }
            },
            required: ["utterance", "lang", "metadata", "visual_guidelines"]
          },
          visualElements: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          svgCode: { type: Type.STRING }
        },
        required: ["nlu", "visualElements", "imagePrompt", "svgCode"]
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  return result;
};
