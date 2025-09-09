import { Request, Response } from "express";
import { DependencyContainer } from "../../application/container/DependencyContainer";
import { CreateTaskUseCase } from "../../domain/usecases/CreateTaskUseCase";
import { GetTaskUseCase } from "../../domain/usecases/GetTaskUseCase";
import { Logger } from "../../utils/logger";
import { uploadSingle } from "../../middleware/upload";
import { IImageProcessor } from "../../domain/ports/IImageProcessor";
import path from "path";
import fs from "fs-extra";

/**
 * Controller Hexagonal para Tasks
 * REUTILIZA a lógica do TaskController existente, mas usando arquitetura hexagonal
 */
export class HexagonalTaskController {
  private createTaskUseCase: CreateTaskUseCase;
  private getTaskUseCase: GetTaskUseCase;
  private imageProcessor: IImageProcessor;

  constructor() {
    const container = DependencyContainer.getInstance();
    this.createTaskUseCase = container.getCreateTaskUseCase();
    this.getTaskUseCase = container.getGetTaskUseCase();
    this.imageProcessor = container.getImageProcessor();
  }

  /**
   * POST /tasks - Cria uma nova tarefa de processamento
   * REUTILIZA a lógica do TaskController existente
   */
  public async createTask(req: Request, res: Response): Promise<void> {
    try {
      let imagePath: string;

      // DEBUG: Log completo da requisição (reutiliza lógica existente)
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
        bodyKeys: req.body ? Object.keys(req.body) : [],
        bodyImagePath: req.body?.imagePath,
        contentType: req.headers["content-type"],
      });

      // Determina o tipo de upload e extrai o imagePath (reutiliza lógica existente)
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Upload multipart (reutiliza lógica existente)
        const file = req.files[0];
        imagePath = file.path;

        Logger.info("Image source provided via multipart upload", {
          originalName: file.originalname,
          tempPath: file.path,
          size: file.size,
          mimetype: file.mimetype,
        });

        // Valida se é uma imagem (reutiliza lógica existente)
        if (!file.mimetype.startsWith("image/")) {
          // Remove o arquivo temporário se não for uma imagem
          await fs.remove(file.path);
          res.status(400).json({
            success: false,
            error: "File must be an image",
            message: "Only image files are allowed",
          });
          return;
        }

        // Usa o Use Case hexagonal (que delega para o TaskService existente)
        const result = await this.createTaskUseCase.execute({
          imagePath,
          uploadType: "multipart",
          originalFileName: file.originalname,
        });

        res.status(201).json({
          success: true,
          data: result,
          message: "Task created successfully",
        });
      } else if (req.body && req.body.imagePath) {
        // Upload via JSON (reutiliza lógica existente)
        imagePath = req.body.imagePath;

        Logger.info("Image source provided via JSON", {
          imagePath,
          isUrl: this.imageProcessor.isValidImageUrl(imagePath),
          isLocalPath: this.imageProcessor.isValidLocalPath(imagePath),
        });

        // Usa o Use Case hexagonal (que delega para o TaskService existente)
        const result = await this.createTaskUseCase.execute({
          imagePath,
          uploadType: "json",
        });

        res.status(201).json({
          success: true,
          data: result,
          message: "Task created successfully",
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Missing image source",
          message: "Provide imagePath in JSON body or upload a file",
        });
        return;
      }
    } catch (error) {
      Logger.error("Error in createTask controller", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Determina o status code baseado no tipo de erro
      const statusCode =
        error instanceof Error &&
        (error.message.includes("Invalid image file") ||
          error.message.includes("format not supported") ||
          error.message.includes("not found"))
          ? 400
          : 500;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        message: "Failed to create task",
      });
    }
  }

  /**
   * GET /tasks/:id - Busca uma tarefa por ID
   * REUTILIZA a lógica do TaskController existente
   */
  public async getTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        res.status(400).json({
          success: false,
          error: "Task ID is required",
          message: "Provide a valid task ID",
        });
        return;
      }

      // Usa o Use Case hexagonal (que delega para o TaskService existente)
      const result = await this.getTaskUseCase.execute(taskId);

      res.status(200).json({
        success: true,
        data: result,
        message: "Task retrieved successfully",
      });
    } catch (error) {
      Logger.error("Error in getTask controller", {
        taskId: req.params.taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      const statusCode =
        error instanceof Error && error.message === "Task not found"
          ? 404
          : 500;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        message:
          error instanceof Error && error.message === "Task not found"
            ? "Task not found"
            : "Failed to get task",
      });
    }
  }

  /**
   * GET /health - Health check
   * REUTILIZA a lógica do TaskController existente
   */
  public async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Pixel Engine API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  }
}
