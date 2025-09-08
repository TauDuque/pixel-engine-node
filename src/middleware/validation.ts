import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../types";
import { ImageProcessor } from "../utils/imageProcessor";
import mongoose from "mongoose";

export class ValidationMiddleware {
  public static validateCreateTask(
    req: Request,
    res: Response,
    next: NextFunction
  ): void | Response {
    // Verifica se é upload de arquivo (multipart) ou JSON
    const hasFile =
      req.files && Array.isArray(req.files) && req.files.length > 0;
    const hasImagePath = req.body && req.body.imagePath;

    if (!hasFile && !hasImagePath) {
      const response: ErrorResponse = {
        success: false,
        error: "Validation Error",
        message:
          "Either imagePath (JSON - local path or URL) or file upload (multipart) is required",
        statusCode: 400,
      };
      return res.status(400).json(response);
    }

    // Se é JSON, valida o imagePath
    if (hasImagePath && !hasFile) {
      const { imagePath } = req.body;

      if (typeof imagePath !== "string") {
        const response: ErrorResponse = {
          success: false,
          error: "Validation Error",
          message: "Image path must be a string",
          statusCode: 400,
        };
        return res.status(400).json(response);
      }

      if (imagePath.length < 1 || imagePath.length > 2000) {
        const response: ErrorResponse = {
          success: false,
          error: "Validation Error",
          message: "Image path/URL must be between 1 and 2000 characters",
          statusCode: 400,
        };
        return res.status(400).json(response);
      }

      // Valida se é uma fonte de imagem válida (URL ou caminho local)
      if (!ImageProcessor.isValidImageSource(imagePath)) {
        const response: ErrorResponse = {
          success: false,
          error: "Validation Error",
          message:
            "Invalid image source. Must be a valid URL or local file path with supported format (jpg, jpeg, png, webp)",
          statusCode: 400,
        };
        return res.status(400).json(response);
      }
    }

    next();
  }

  public static validateTaskId(
    req: Request,
    res: Response,
    next: NextFunction
  ): void | Response {
    const { taskId } = req.params;

    if (!taskId) {
      const response: ErrorResponse = {
        success: false,
        error: "Validation Error",
        message: "Task ID is required",
        statusCode: 400,
      };
      return res.status(400).json(response);
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      const response: ErrorResponse = {
        success: false,
        error: "Validation Error",
        message: "Invalid task ID format",
        statusCode: 400,
      };
      return res.status(400).json(response);
    }

    next();
  }
}
