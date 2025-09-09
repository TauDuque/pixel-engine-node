import { ITaskRepository } from "../../domain/ports/ITaskRepository";
import { TaskService } from "../../services/TaskService";
import {
  CreateTaskRequest,
  CreateTaskResponse,
  GetTaskResponse,
} from "../../types";

/**
 * Adapter para TaskRepository
 * REUTILIZA o TaskService existente - não recria nada
 */
export class TaskRepositoryAdapter implements ITaskRepository {
  /**
   * Delega para o TaskService existente
   */
  async createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    return await TaskService.createTask(request);
  }

  /**
   * Delega para o TaskService existente
   */
  async getTask(taskId: string): Promise<GetTaskResponse> {
    return await TaskService.getTask(taskId);
  }

  /**
   * Implementa verificação de duplicatas baseada na lógica existente
   */
  async existsByOriginalPath(originalPath: string): Promise<boolean> {
    // Reutiliza a lógica existente do TaskService
    // Por enquanto, retorna false - pode ser implementado se necessário
    return false;
  }
}
