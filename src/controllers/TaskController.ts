import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { Logger } from "../utils/logger";
import { ApiResponse, CreateTaskRequest } from "../types";

export class TaskController {
  /**
   * POST /tasks - Cria uma nova tarefa de processamento
   */
  public static async createTask(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateTaskRequest = req.body;

      const result = await TaskService.createTask(request);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: "Task created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      Logger.error("Error in createTask controller", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Determine appropriate status code based on error type
      const isValidationError =
        error instanceof Error &&
        (error.message.includes("already been processed") ||
          error.message.includes("Invalid image file"));
      const statusCode = isValidationError ? 400 : 500;

      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        message: "Failed to create task",
      };

      res.status(statusCode).json(response);
    }
  }

  /**
   * GET /tasks/:taskId - Busca uma tarefa pelo ID
   */
  public static async getTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;

      const result = await TaskService.getTask(taskId);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: "Task retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      Logger.error("Error in getTask controller", {
        taskId: req.params.taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      const isNotFound =
        error instanceof Error && error.message === "Task not found";
      const statusCode = isNotFound ? 404 : 500;

      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        message: isNotFound ? "Task not found" : "Failed to retrieve task",
      };

      res.status(statusCode).json(response);
    }
  }
}
