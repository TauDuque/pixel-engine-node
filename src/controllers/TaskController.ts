import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { Logger } from "../utils/logger";
import { ApiResponse, CreateTaskRequest } from "../types";
import { uploadSingle } from "../middleware/upload";
import path from "path";

export class TaskController {
  /**
   * POST /tasks - Cria uma nova tarefa de processamento
   * Suporta tanto JSON (imagePath) quanto multipart (file upload)
   */
  public static async createTask(req: Request, res: Response): Promise<void> {
    try {
      let imagePath: string;

      // DEBUG: Log completo da requisição
      Logger.info("DEBUG - Request details", {
        hasFiles: !!req.files,
        filesType: typeof req.files,
        filesIsArray: Array.isArray(req.files),
        filesLength: req.files
          ? Array.isArray(req.files)
            ? req.files.length
            : "not array"
          : "no files",
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : "no body",
        bodyImagePath: req.body?.imagePath,
        contentType: req.headers["content-type"],
      });

      // Verifica se é upload de arquivo (multipart) ou JSON
      let uploadType: "json" | "multipart" = "json";
      let originalFileName: string | undefined;

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Upload de arquivo via multipart - usa o primeiro arquivo
        const file = req.files[0] as Express.Multer.File;
        imagePath = file.path;
        uploadType = "multipart";
        originalFileName = file.originalname;
        Logger.info("File uploaded via multipart", {
          filename: file.originalname,
          path: imagePath,
          fileSize: file.size,
          mimetype: file.mimetype,
          uploadType: uploadType,
          originalFileName: originalFileName,
        });
      } else if (req.body.imagePath) {
        // JSON com imagePath
        imagePath = req.body.imagePath;
        uploadType = "json";
        Logger.info("Image path provided via JSON", { imagePath });
      } else {
        Logger.error("No valid input found", {
          files: req.files,
          body: req.body,
          headers: req.headers,
        });
        throw new Error(
          "Either imagePath (JSON) or file upload (multipart) is required"
        );
      }

      const request: CreateTaskRequest = {
        imagePath,
        uploadType,
        originalFileName,
      };

      Logger.info("=== CONTROLLER SENDING TO TASK SERVICE ===", {
        request: {
          imagePath: request.imagePath,
          uploadType: request.uploadType,
          originalFileName: request.originalFileName,
        },
      });

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
