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
   * REUTILIZA a lógica do TaskController existente com todas as funcionalidades
   */
  public async createTask(req: Request, res: Response): Promise<void> {
    try {
      let imagePath: string;
      let uploadType: "json" | "multipart" = "json";
      let originalFileName: string | undefined;

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

      // Verifica se é upload de arquivo (multipart) ou JSON
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Upload de arquivo via multipart - REUTILIZA lógica completa do TaskController
        const file = req.files[0] as Express.Multer.File;
        uploadType = "multipart";

        // Salva o buffer temporariamente para processamento (lógica original)
        const tempPath = path.join(process.cwd(), "temp", file.originalname);
        await fs.ensureDir(path.dirname(tempPath));
        await fs.writeFile(tempPath, file.buffer);
        imagePath = tempPath;

        // Para multipart, constrói o caminho removendo o timestamp (lógica original)
        const nameParts = file.originalname.split(".");
        const nameWithoutExt = nameParts[0]; // "jeanne dark"
        const extension = nameParts[1]; // "jpg"

        // Busca o match no nome original e remove tudo após o match (lógica original)
        const matchIndex = file.originalname.indexOf(nameWithoutExt);
        let originalPath: string;
        if (matchIndex !== -1) {
          const pathWithoutTimestamp = file.originalname.substring(
            0,
            matchIndex + nameWithoutExt.length
          );
          originalPath = pathWithoutTimestamp + "." + extension;
          originalFileName = originalPath;
        } else {
          // Fallback: usa o nome original se não encontrar match
          originalPath = file.originalname;
          originalFileName = file.originalname;
        }

        Logger.info("File uploaded via multipart (buffer)", {
          filename: file.originalname,
          tempPath: imagePath,
          nameWithoutExt: nameWithoutExt,
          extension: extension,
          matchIndex: matchIndex,
          originalPath: originalPath,
          finalPath: originalFileName,
          fileSize: file.size,
          mimetype: file.mimetype,
          uploadType: uploadType,
          originalFileName: originalFileName,
        });

        // Usa o Use Case hexagonal (que delega para o TaskService existente)
        const result = await this.createTaskUseCase.execute({
          imagePath,
          uploadType: "multipart",
          originalFileName: originalFileName,
        });

        res.status(201).json({
          success: true,
          data: result,
          message: "Task created successfully",
        });
      } else if (req.body && req.body.imagePath) {
        // JSON com imagePath (pode ser caminho local ou URL) - REUTILIZA lógica original
        imagePath = req.body.imagePath;
        uploadType = "json";

        // Valida se é uma fonte de imagem válida (URL ou caminho local) - lógica original
        if (!this.imageProcessor.isValidImageSource(imagePath)) {
          throw new Error(
            "Invalid image source. Must be a valid URL or local file path with supported format."
          );
        }

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
        Logger.error("No valid input found", {
          files: req.files,
          body: req.body,
          headers: req.headers,
        });
        throw new Error(
          "Either imagePath (JSON - local path or URL) or file upload (multipart) is required"
        );
      }
    } catch (error) {
      Logger.error("Error in createTask controller", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Determine appropriate status code based on error type (lógica original)
      const isValidationError =
        error instanceof Error &&
        (error.message.includes("already been processed") ||
          error.message.includes("Invalid image file") ||
          error.message.includes("Invalid image source"));
      const statusCode = isValidationError ? 400 : 500;

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
