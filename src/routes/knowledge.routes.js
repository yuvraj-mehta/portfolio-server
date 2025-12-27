import { Router } from "express"
import { initProfile } from "../controllers/syncData.controller.js"
import { validateSchema } from "../middlewares/validateSchema.middleware.js"

const router = Router()

/**
 * POST /profile/init
 * Initialize or update portfolio profile
 * 
 * Request Flow:
 * 1. Client sends POST request with portfolio data payload
 * 2. validateSchema middleware (AJV) validates payload against schema
 * 3. If validation fails: return 400 with validation errors
 * 4. If validation passes: proceed to initProfile controller
 * 5. initProfile controller saves validated data to portfolio.latest.json
 * 6. Return 201 with success response
 * 
 * Expected Payload Structure:
 * {
 *   "meta": {
 *     "version": "1.0.0",
 *     "timestamp": "2025-12-27T10:30:00Z"
 *   },
 *   "personalInfo": {
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "title": "Full Stack Developer",
 *     ...
 *   },
 *   "experience": [...],
 *   "skills": [...],
 *   "projects": [...],
 *   "education": [...],
 *   "socialLinks": {...}
 * }
 */
router.post("/profile/init", validateSchema, initProfile)

export default router