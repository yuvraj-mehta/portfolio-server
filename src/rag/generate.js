import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/envConfig.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

/**
 * Generate an answer using retrieved context
 * @param {string} query
 * @param {Array<{text: string, title: string}>} contexts
 */
export async function generateAnswer(query, contexts) {
  const contextText = contexts
    .map((c, i) => `(${i + 1}) ${c.text}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: `
Context:
${contextText}

Question:
${query}
`
      }
    ],
    temperature: 0.3
  });

  return response.choices[0].message.content;
}