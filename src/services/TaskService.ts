import { TaskModel } from "../models/Task";
import { ImageModel } from "../models/Image";
import { ImageProcessor } from "../utils/imageProcessor";
import { Logger } from "../utils/logger";
import { config } from "../config/environment";
import {
  CreateTaskRequest,
  CreateTaskResponse,
  GetTaskResponse,
  TaskStatusType,
} from "../types";
import mongoose from "mongoose";
import { Worker } from "worker_threads";
import path from "path";
import fs from "fs-extra";

export class TaskService {
  /**
   * Cria uma nova tarefa de processamento de imagem
   */
  public static async createTask(
    request: CreateTaskRequest
  ): Promise<CreateTaskResponse> {
    try {
      Logger.info("=== TASK SERVICE CREATE TASK START ===", {
        request: {
          imagePath: request.imagePath,
          uploadType: request.uploadType,
          originalFileName: request.originalFileName,
        },
      });

      // Valida se a imagem existe e é válida
      const isValidImage = await ImageProcessor.validateImage(
        request.imagePath
      );
      if (!isValidImage) {
        throw new Error("Invalid image file or format not supported");
      }

      Logger.info("Checking for duplicate image", {
        uploadType: request.uploadType,
        originalFileName: request.originalFileName,
        imagePath: request.imagePath,
      });

      // Para ambos os tipos: usa o mesmo path que será salvo no banco
      let pathForDuplicateCheck: string;

      if (request.uploadType === "multipart" && request.originalFileName) {
        pathForDuplicateCheck = request.originalFileName; // Agora é o caminho construído
      } else {
        pathForDuplicateCheck = request.imagePath;
      }

      // Normaliza barras invertidas para barras normais
      if (pathForDuplicateCheck.includes("\\")) {
        pathForDuplicateCheck = pathForDuplicateCheck.replace(/\\+/g, "/");
      }

      Logger.info("Checking duplicate by path", {
        uploadType: request.uploadType,
        originalFileName: request.originalFileName,
        imagePath: request.imagePath,
        pathForDuplicateCheck: pathForDuplicateCheck,
      });

      const existingImage = await ImageModel.findOne({
        originalPath: pathForDuplicateCheck,
      });

      Logger.info("Duplicate check result", {
        foundExisting: !!existingImage,
        existingImageId: existingImage?._id,
      });

      if (existingImage) {
        throw new Error(
          "Image has already been processed. Please use a different image."
        );
      }

      // Gera preço aleatório
      const price = ImageProcessor.generateRandomPrice();

      // Cria a tarefa no banco - usa o mesmo path da validação de duplicidade
      const originalPathForDb = pathForDuplicateCheck;

      Logger.info("Saving task with originalPath", {
        uploadType: request.uploadType,
        originalFileName: request.originalFileName,
        imagePath: request.imagePath,
        originalPathForDb: originalPathForDb,
      });

      const task = new TaskModel({
        status: "pending" as TaskStatusType,
        price,
        originalPath: originalPathForDb,
        images: [],
      });

      const savedTask = await task.save();
      Logger.info("Task created", { taskId: savedTask._id, price });

      // Processa a imagem usando Worker Thread
      // Para multipart, precisa passar o buffer
      // Para JSON, usa o imagePath (caminho original)
      if (request.uploadType === "multipart") {
        // Para multipart, precisamos passar o buffer
        // Mas o worker não suporta buffer ainda, então vamos manter o arquivo temporário
        this.processImageWithWorker(
          savedTask._id?.toString() || "",
          request.imagePath,
          originalPathForDb
        );
      } else {
        // Para JSON, usa o imagePath (caminho original)
        this.processImageWithWorker(
          savedTask._id?.toString() || "",
          request.imagePath,
          originalPathForDb
        );
      }

      return {
        taskId: savedTask._id?.toString() || "",
        status: savedTask.status,
        price: savedTask.price,
      };
    } catch (error) {
      Logger.error("Error creating task", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Busca uma tarefa pelo ID
   */
  public static async getTask(taskId: string): Promise<GetTaskResponse> {
    try {
      const task = await TaskModel.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      return {
        taskId: task._id?.toString() || "",
        status: task.status,
        price: task.price,
        images: task.images,
        error: task.error,
      };
    } catch (error) {
      Logger.error("Error getting task", {
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Processa a imagem usando Worker Thread
   */
  private static processImageWithWorker(
    taskId: string,
    imagePath: string,
    originalPath: string
  ): void {
    try {
      Logger.info("Starting image processing with worker thread", {
        taskId,
        imagePath,
        outputDir: config.outputDir,
      });

      // Cria o worker thread
      const workerPath = path.join(
        __dirname,
        "../workers/imageProcessorWorker.js"
      );
      const worker = new Worker(workerPath, {
        workerData: {
          taskId,
          imagePath,
          originalPath,
          outputDir: config.outputDir,
        },
      });

      // Escuta mensagens do worker
      worker.on("message", async (result) => {
        try {
          Logger.info("Received worker message", {
            taskId,
            status: result.status,
            processingTimeMs: result.processingTimeMs,
          });

          if (result.status === "completed") {
            await this.handleWorkerSuccess(taskId, result.images, originalPath);
          } else if (result.status === "failed") {
            await this.handleWorkerError(taskId, result.error);
          }
        } catch (error) {
          Logger.error("Error handling worker result", {
            taskId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          // Termina o worker
          worker.terminate();
        }
      });

      // Escuta erros do worker
      worker.on("error", async (error) => {
        Logger.error("Worker thread error", {
          taskId,
          error: error.message,
          stack: error.stack,
        });
        await this.handleWorkerError(taskId, error.message);
        worker.terminate();
      });

      // Escuta quando o worker termina
      worker.on("exit", (code) => {
        if (code !== 0) {
          Logger.warn("Worker thread exited with non-zero code", {
            taskId,
            exitCode: code,
          });
        } else {
          Logger.info("Worker thread completed successfully", { taskId });
        }
      });
    } catch (error) {
      Logger.error("Error creating worker thread", {
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Fallback: marca como falhada
      this.handleWorkerError(
        taskId,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Manipula sucesso do worker
   */
  private static async handleWorkerSuccess(
    taskId: string,
    processedImages: any[],
    originalImagePath: string
  ): Promise<void> {
    try {
      // Atualiza a tarefa com as imagens processadas
      await TaskModel.findByIdAndUpdate(taskId, {
        status: "completed" as TaskStatusType,
        images: processedImages.map((img) => ({
          resolution: img.resolution,
          path: img.path,
          md5: img.md5,
          createdAt: new Date(),
        })),
        updatedAt: new Date(),
      });

      // Salva as imagens na coleção separada
      const imageDocuments = processedImages.map((img) => ({
        path: img.path,
        resolution: img.resolution,
        md5: img.md5,
        originalPath: img.originalName || originalImagePath, // Usa o originalName retornado pelo ImageProcessor
        taskId: new mongoose.Types.ObjectId(taskId),
      }));

      await ImageModel.insertMany(imageDocuments);

      Logger.info("Image processing completed via worker", {
        taskId,
        imagesCount: processedImages.length,
      });

      // Limpa arquivo temporário se foi upload multipart
      await this.cleanupTempFile(taskId);
    } catch (error) {
      Logger.error("Error handling worker success", {
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Manipula erro do worker
   */
  private static async handleWorkerError(
    taskId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      await TaskModel.findByIdAndUpdate(taskId, {
        status: "failed" as TaskStatusType,
        error: errorMessage,
        updatedAt: new Date(),
      });

      Logger.error("Image processing failed via worker", {
        taskId,
        error: errorMessage,
      });

      // Limpa arquivo temporário mesmo em caso de erro
      await this.cleanupTempFile(taskId);
    } catch (error) {
      Logger.error("Error handling worker error", {
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Limpa arquivo temporário se foi upload multipart
   */
  private static async cleanupTempFile(taskId: string): Promise<void> {
    try {
      const task = await TaskModel.findById(taskId);
      if (!task) return;

      // Verifica se foi upload multipart (originalPath contém "temp/")
      if (task.originalPath && task.originalPath.includes("temp/")) {
        const tempFilePath = path.join(process.cwd(), task.originalPath);

        // Verifica se o arquivo existe e deleta
        if (await fs.pathExists(tempFilePath)) {
          await fs.remove(tempFilePath);
          Logger.info("Temporary file cleaned up", {
            taskId,
            tempFilePath,
          });
        }
      }
    } catch (error) {
      Logger.error("Error cleaning up temporary file", {
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
