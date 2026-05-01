import { GoogleGenAI, Type } from "@google/genai";

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export interface TrainingTask {
  title: string;
  description: string;
  duration: string;
  intensity: 'low' | 'medium' | 'high';
}

export interface TrainingPlan {
  name: string;
  focus: string;
  tasks: TrainingTask[];
}

export const generateAITrainingPlan = async (athleteInfo: string): Promise<TrainingPlan> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Okçuluk sporcusu için şu bilgilere dayanarak haftalık antrenman planı oluştur: ${athleteInfo}`,
    config: {
      systemInstruction: "Sen 'AimTrack Coach' sisteminin baş okçuluk antrenörüsün. Dünyaca ünlü okçuluk tekniklerini (KSL yöntemi gibi) baz alarak, sporcuların gelişim verilerine göre teknik odaklı, kas hafızası ve mental dayanıklılık içeren antrenman planları hazırlarsın. Planların teknik terimler (çapa, bırakış, sırt aktivasyonu vb.) içermeli. Yanıtın sadece JSON formatında olsun.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Planın adı (Örn: Teknik Hassasiyet Haftası)" },
          focus: { type: Type.STRING, description: "Haftanın ana odak noktası (Örn: Sırt gerilimi ve bırakış kontrolü)" },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                duration: { type: Type.STRING },
                intensity: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
              },
              required: ['title', 'description', 'duration', 'intensity']
            }
          }
        },
        required: ['name', 'focus', 'tasks']
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzePerformance = async (scores: number[], feedback: string): Promise<string> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Sporcunun son puanları: ${scores.join(', ')}. Antrenör yorumu: ${feedback}. Bu verileri analiz et ve sporcuya profesyonel, yapıcı bir geri bildirim hazırla.`,
    config: {
      systemInstruction: "Sen AimTrack AI performans analistisin. Okçuluk biyomekaniği ve veri analitiği konusunda uzmansın. Puan dağılımını analiz et, tutarlılık (grouping) tahmini yap ve sporcuya olimpiyat seviyesinde bir vizyonla tavsiyeler ver."
    }
  });

  return response.text;
};
