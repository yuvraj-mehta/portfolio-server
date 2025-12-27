import { catchAsyncErrors } from "../middlewares/index.js";
import FileStorageService from "../services/fileStorage.service.js";

export const syncData = catchAsyncErrors(async (req, res, next) => {
  const payload = req.body;
  res.status(200).json({
    success: true,
    message: "Payload accepted",
    meta: payload?.meta || null,
  });
});

/**
 * Initialize/Update Portfolio Profile
 * 
 * Flow:
 * 1. Request arrives with validated payload (AJV validation middleware handles this)
 * 2. Controller receives already-validated data via req.body
 * 3. Business logic: Save validated data to file storage
 * 4. Return success response with saved data info
 * 
 * @route POST /profile/init
 * @middleware validateSchema - AJV validation middleware
 * @param {Object} req.body - Validated portfolio profile data
 * @returns {Object} Success response with saved data info
 */
export const initProfile = catchAsyncErrors(async (req, res, next) => {
  // At this point, the payload has already been validated by AJV middleware
  const validatedPayload = req.body;

  // Business decision: Save the validated payload to file storage
  const saveResult = await FileStorageService.saveLatestPortfolio(
    validatedPayload
  );

  // Return success response
  res.status(201).json({
    success: true,
    message: "Portfolio profile initialized successfully",
    data: {
      savedAt: saveResult.savedAt,
      filePath: saveResult.filePath,
      profileMeta: validatedPayload?.meta || null,
    },
  });
});