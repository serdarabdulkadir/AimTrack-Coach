import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTrainingPlan(stats: any, currentFocus: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Athlete Stats: ${JSON.stringify(stats)}. Current Focus: ${currentFocus}. 
      Generate a structured elite archery training plan for the next week. 
      Include 5 specific tasks focusing on technical correction and physical conditioning.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            notes: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  description: { type: Type.STRING }
                },
                required: ["text", "priority"]
              }
            }
          },
          required: ["title", "tasks"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}
