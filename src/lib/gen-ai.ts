import { GoogleGenAI, ContentListUnion } from "@google/genai";

interface ChatBotOptions {
  contents: ContentListUnion;
  instruction: string;
  id: string;
  GEN_AI_KEY: string;
}

export default async function generativeAi(options: ChatBotOptions) {
  const genAi = new GoogleGenAI({ apiKey: options.GEN_AI_KEY });
  const model = "gemini-2.0-flash-001";

  const response = await genAi.models.generateContent({
    model,
    contents: options.contents,
    config: {
      systemInstruction: options.instruction,
    },
  });

  return response.text;
}
