import Ajv from "ajv";
import addFormats from "ajv-formats";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const portfolioSchema = require("../schema/portfolio.schema.json");

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

const validatePayload = ajv.compile(portfolioSchema);

/**
 * AJV Validation Middleware
 * Validates request payload against portfolio schema
 * If validation fails, returns 400 with validation errors
 */
export const validateSchema = (req, res, next) => {
  const isValid = validatePayload(req.body);

  if (!isValid) {
    const errors = validatePayload.errors.map((error) => ({
      field: error.dataPath || error.instancePath || "root",
      message: error.message,
      keyword: error.keyword,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Validation passed, proceed to next middleware/controller
  next();
};

export default validateSchema;
