import { ITaskRepository } from "../../domain/ports/ITaskRepository";
import { IImageProcessor } from "../../domain/ports/IImageProcessor";
import { IUrlDownloader } from "../../domain/ports/IUrlDownloader";
import { CreateTaskUseCase } from "../../domain/usecases/CreateTaskUseCase";
import { GetTaskUseCase } from "../../domain/usecases/GetTaskUseCase";

// Adapters que reutilizam código existente
import { TaskRepositoryAdapter } from "../../infrastructure/adapters/TaskRepositoryAdapter";
import { ImageProcessorAdapter } from "../../infrastructure/adapters/ImageProcessorAdapter";
import { UrlDownloaderAdapter } from "../../infrastructure/adapters/UrlDownloaderAdapter";

/**
 * Container de Dependências
 * Centraliza a criação e injeção de dependências seguindo o padrão DI
 * REUTILIZA todo o código existente através dos adapters
 */
export class DependencyContainer {
  private static instance: DependencyContainer;

  // Repositories (adapters que reutilizam código existente)
  private taskRepository!: ITaskRepository;
  private imageProcessor!: IImageProcessor;
  private urlDownloader!: IUrlDownloader;

  // Use Cases
  private createTaskUseCase!: CreateTaskUseCase;
  private getTaskUseCase!: GetTaskUseCase;

  private constructor() {
    this.initializeDependencies();
  }

  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  private initializeDependencies(): void {
    // Initialize Adapters (que reutilizam código existente)
    this.taskRepository = new TaskRepositoryAdapter();
    this.imageProcessor = new ImageProcessorAdapter();
    this.urlDownloader = new UrlDownloaderAdapter();

    // Initialize Use Cases
    this.createTaskUseCase = new CreateTaskUseCase(
      this.taskRepository,
      this.imageProcessor,
      this.urlDownloader
    );

    this.getTaskUseCase = new GetTaskUseCase(this.taskRepository);
  }

  // Getters for Dependencies
  public getTaskRepository(): ITaskRepository {
    return this.taskRepository;
  }

  public getImageProcessor(): IImageProcessor {
    return this.imageProcessor;
  }

  public getUrlDownloader(): IUrlDownloader {
    return this.urlDownloader;
  }

  public getCreateTaskUseCase(): CreateTaskUseCase {
    return this.createTaskUseCase;
  }

  public getGetTaskUseCase(): GetTaskUseCase {
    return this.getTaskUseCase;
  }
}
