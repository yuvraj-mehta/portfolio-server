import { QdrantClient } from "@qdrant/js-client-rest"
import dotenv from "dotenv"

dotenv.config()

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  checkCompatibility: false
})

async function init() {
  await client.createCollection("portfolio_chunks", {
    vectors: {
      size: 3072, // OpenAI embedding size
      distance: "Cosine"
    }
  })

  console.log("✅ Qdrant collection created")
}

init().catch(console.error)