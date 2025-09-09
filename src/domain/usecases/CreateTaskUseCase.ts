import { ITaskRepository } from "../ports/ITaskRepository";
import { IImageProcessor } from "../ports/IImageProcessor";
import { IUrlDownloader } from "../ports/IUrlDownloader";
import { CreateTaskRequest, CreateTaskResponse } from "../../types";

/**
 * Use Case para criação de tarefas
 * Orquestra os adapters que reutilizam o código existente
 */
export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly imageProcessor: IImageProcessor,
    private readonly urlDownloader: IUrlDownloader
  ) {}

  async execute(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    // Delega para o TaskRepository que usa o TaskService existente
    return await this.taskRepository.createTask(request);
  }
}
