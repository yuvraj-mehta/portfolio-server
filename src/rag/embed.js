import fs from "fs"
import OpenAI from "openai"
import { QdrantClient } from "@qdrant/js-client-rest"
import { OPENAI_API_KEY } from "../config/envConfig.js"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  checkCompatibility: false
})

const DATA_PATH = path.join(__dirname, "../data/normalized.json")

// Convert string ID to numeric ID
function hashStringToId(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

async function embedPortfolio() {
  const COLLECTION = "portfolio_chunks"
  const VECTOR_SIZE = 3072 // text-embedding-3-large

  // Ensure collection exists before upserting points
  try {
    await qdrant.getCollection(COLLECTION)
  } catch (err) {
    const msg = err?.data?.status?.error || err?.message || ""
    const isNotFound = err?.status === 404 || /Not found/i.test(msg)
    const isAlreadyExists = err?.status === 409 || /Already exists/i.test(msg)

    if (isNotFound) {
      await qdrant.createCollection(COLLECTION, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine"
        }
      })
      console.log(`✅ Created collection '${COLLECTION}'`)
    } else if (!isAlreadyExists) {
      throw err
    }
  }

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"))

  const points = []

  for (const chunk of raw.chunks) {
    if (!chunk.shouldEmbed) continue

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: chunk.text
    })

    points.push({
      id: hashStringToId(chunk.id),
      vector: embedding.data[0].embedding,
      payload: {
        chunkId: chunk.id,
        chunkType: chunk.chunkType,
        source: chunk.source,
        title: chunk.title,
        tags: chunk.tags,
        text: chunk.text,
        meta: chunk.meta
      }
    })
  }

  await qdrant.upsert(COLLECTION, {
    points
  })

  console.log(`✅ Embedded ${points.length} chunks`)
}

embedPortfolio().catch(console.error)
