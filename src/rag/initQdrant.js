import { QdrantClient } from "@qdrant/js-client-rest"
import { QDRANT_URL } from "../config/envConfig.js"

const client = new QdrantClient({
  url: QDRANT_URL,
  checkCompatibility: false
})

async function ensureCollection(name) {
  try {
    await client.getCollection(name)
    console.log(`ℹ️ Collection '${name}' already exists; skipping creation.`)
  } catch (err) {
    const msg = err?.data?.status?.error || err?.message || ""
    const isNotFound = err?.status === 404 || /Not found/i.test(msg)
    const isAlreadyExists = err?.status === 409 || /Already exists/i.test(msg)

    if (isAlreadyExists) {
      console.log(`ℹ️ Collection '${name}' already exists; skipping creation.`)
      return
    }

    if (isNotFound) {
      await client.createCollection(name, {
        vectors: {
          size: 3072, // OpenAI embedding size
          distance: "Cosine"
        }
      })
      console.log(`✅ Created collection '${name}'`)
      return
    }

    throw err
  }
}

async function init() {
  await ensureCollection("portfolio_chunks")
}

init().catch(console.error)
