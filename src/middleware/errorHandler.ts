import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger";
import { ErrorResponse } from "../types";

export class ErrorHandler {
  public static handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    Logger.error("Unhandled error", {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });

    const statusCode = ErrorHandler.getStatusCode(error);
    const response: ErrorResponse = {
      success: false,
      error: error.message,
      message: ErrorHandler.getErrorMessage(error),
      statusCode,
    };

    res.status(statusCode).json(response);
  }

  public static notFound(req: Request, res: Response): void {
    const response: ErrorResponse = {
      success: false,
      error: "Not Found",
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404,
    };

    res.status(404).json(response);
  }

  private static getStatusCode(error: any): number {
    // Multer errors
    if (error.code === "LIMIT_FILE_SIZE") return 400;
    if (error.code === "LIMIT_UNEXPECTED_FILE") return 400;
    if (error.message && error.message.includes("Invalid file type"))
      return 400;

    // Standard errors
    if (error.name === "ValidationError") return 400;
    if (error.name === "CastError") return 400;
    if (error.message && error.message.includes("not found")) return 404;
    if (error.message && error.message.includes("unauthorized")) return 401;
    if (error.message && error.message.includes("forbidden")) return 403;
    return 500;
  }

  private static getErrorMessage(error: any): string {
    // Multer errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return "File too large. Maximum size is 10MB";
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return "Unexpected file field";
    }
    if (error.message && error.message.includes("Invalid file type")) {
      return "Invalid file type. Only JPEG, PNG, and WebP images are allowed";
    }

    // Standard errors
    if (error.name === "ValidationError") {
      return "Validation error";
    }
    if (error.name === "CastError") {
      return "Invalid ID format";
    }
    return "Internal server error";
  }
}
