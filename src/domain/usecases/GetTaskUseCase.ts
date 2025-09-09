import { ITaskRepository } from "../ports/ITaskRepository";
import { GetTaskResponse } from "../../types";

/**
 * Use Case para buscar tarefas
 * Orquestra os adapters que reutilizam o código existente
 */
export class GetTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository
  ) {}

  async execute(taskId: string): Promise<GetTaskResponse> {
    // Delega para o TaskRepository que usa o TaskService existente
    return await this.taskRepository.getTask(taskId);
  }
}
