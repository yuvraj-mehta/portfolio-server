import { config } from "dotenv";

config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI;

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const QDRANT_URL = process.env.QDRANT_URL;