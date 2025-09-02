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

    const statusCode = this.getStatusCode(error);
    const response: ErrorResponse = {
      success: false,
      error: error.message,
      message: this.getErrorMessage(error),
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

  private static getStatusCode(error: Error): number {
    if (error.name === "ValidationError") return 400;
    if (error.name === "CastError") return 400;
    if (error.message.includes("not found")) return 404;
    if (error.message.includes("unauthorized")) return 401;
    if (error.message.includes("forbidden")) return 403;
    return 500;
  }

  private static getErrorMessage(error: Error): string {
    if (error.name === "ValidationError") {
      return "Validation error";
    }
    if (error.name === "CastError") {
      return "Invalid ID format";
    }
    return "Internal server error";
  }
}
