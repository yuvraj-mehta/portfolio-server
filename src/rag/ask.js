import { retrieveContext } from "./retrieve.js";
import { generateAnswer } from "./generate.js";

export async function askPortfolio(query) {
  const contexts = await retrieveContext(query, 5);

  if (!contexts.length) {
    return "That isn’t part of my portfolio yet.";
  }

  return await generateAnswer(query, contexts);
}
