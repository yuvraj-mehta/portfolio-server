import express from "express"
import cors from "cors"
import knowledgeRoutes from "./routes/knowledge.routes.js"
import askRoute from "./routes/ask.js"
import { connectDB } from "./database/index.js"
import { logger, errorHandler } from "./middlewares/index.js"

const app = express()

app.use(cors())
app.use(express.json({ limit: "5mb" })) // IMPORTANT for large payload
app.use(logger) // Request logging
connectDB();

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// Knowledge and Portfolio Routes
app.use("/api", knowledgeRoutes)
app.use("/api/ask", askRoute)


// Global error handler (must be last)
app.use(errorHandler)

export default app
