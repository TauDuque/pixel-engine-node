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

export class TaskService {
  /**
   * Cria uma nova tarefa de processamento de imagem
   */
  public static async createTask(
    request: CreateTaskRequest
  ): Promise<CreateTaskResponse> {
    try {
      // Valida se a imagem existe e é válida
      const isValidImage = await ImageProcessor.validateImage(
        request.imagePath
      );
      if (!isValidImage) {
        throw new Error("Invalid image file or format not supported");
      }

      // Gera preço aleatório
      const price = ImageProcessor.generateRandomPrice();

      // Cria a tarefa no banco
      const task = new TaskModel({
        status: "pending" as TaskStatusType,
        price,
        originalPath: request.imagePath,
        images: [],
      });

      const savedTask = await task.save();
      Logger.info("Task created", { taskId: savedTask._id, price });

      // Processa a imagem de forma assíncrona
      this.processImageAsync(
        savedTask._id?.toString() || "",
        request.imagePath
      );

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
   * Processa a imagem de forma assíncrona
   */
  private static async processImageAsync(
    taskId: string,
    imagePath: string
  ): Promise<void> {
    try {
      Logger.info("Starting image processing", { taskId });

      // Processa a imagem
      const processedImages = await ImageProcessor.processImage(
        imagePath,
        config.outputDir
      );

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
        originalPath: imagePath,
        taskId: new mongoose.Types.ObjectId(taskId),
      }));

      await ImageModel.insertMany(imageDocuments);

      Logger.info("Image processing completed", {
        taskId,
        imagesCount: processedImages.length,
      });
    } catch (error) {
      Logger.error("Error processing image", {
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Marca a tarefa como falhada
      await TaskModel.findByIdAndUpdate(taskId, {
        status: "failed" as TaskStatusType,
        error: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      });
    }
  }
}
