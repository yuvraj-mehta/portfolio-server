import { askPortfolio } from "./ask.js";

const test = async () => {
  const answer = await askPortfolio("Tell me about BookHive");
  console.log("\nANSWER:\n", answer);
};

test();
