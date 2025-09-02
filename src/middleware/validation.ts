import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../types";
import mongoose from "mongoose";

export class ValidationMiddleware {
  public static validateCreateTask(
    req: Request,
    res: Response,
    next: NextFunction
  ): void | Response {
    const { imagePath } = req.body;

    if (!imagePath) {
      const response: ErrorResponse = {
        success: false,
        error: "Validation Error",
        message: "Image path is required",
        statusCode: 400,
      };
      return res.status(400).json(response);
    }

    if (typeof imagePath !== "string") {
      const response: ErrorResponse = {
        success: false,
        error: "Validation Error",
        message: "Image path must be a string",
        statusCode: 400,
      };
      return res.status(400).json(response);
    }

    if (imagePath.length < 1 || imagePath.length > 500) {
      const response: ErrorResponse = {
        success: false,
        error: "Validation Error",
        message: "Image path must be between 1 and 500 characters",
        statusCode: 400,
      };
      return res.status(400).json(response);
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
