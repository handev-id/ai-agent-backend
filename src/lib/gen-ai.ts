import { GoogleGenAI, ContentListUnion } from "@google/genai";

interface ChatBotOptions {
  content: ContentListUnion;
  instruction: string;
  id: string;
  GEN_AI_KEY: string;
}

export default async function generativeAi(options: ChatBotOptions) {
  const genAi = new GoogleGenAI({ apiKey: options.GEN_AI_KEY });
  const model = "gemini-2.0-flash-001";

  const response = await genAi.models.generateContent({
    model,
    contents: options.content,
    config: {
      systemInstruction: options.instruction,
    },
  });

  await genAi.caches
    .create({
      model,
      config: {
        contents: options.content,
        displayName: options.id,
        systemInstruction: options.instruction,
      },
    })
    .catch((err) => {});

  console.log(await genAi.caches.list());

  return response.text;
}
