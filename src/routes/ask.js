import express from "express";
import { askPortfolio } from "../rag/ask.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const answer = await askPortfolio(query);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "RAG failed" });
  }
});

export default router;
