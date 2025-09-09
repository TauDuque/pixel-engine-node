import {
  Task,
  CreateTaskRequest,
  CreateTaskResponse,
  GetTaskResponse,
} from "../../types";

/**
 * Port para repositório de Tasks
 * Baseado no TaskService existente - mantém a mesma interface
 */
export interface ITaskRepository {
  /**
   * Cria uma nova tarefa (baseado em TaskService.createTask)
   */
  createTask(request: CreateTaskRequest): Promise<CreateTaskResponse>;

  /**
   * Busca uma tarefa por ID (baseado em TaskService.getTask)
   */
  getTask(taskId: string): Promise<GetTaskResponse>;

  /**
   * Verifica se já existe uma imagem processada (baseado na lógica de duplicatas)
   */
  existsByOriginalPath(originalPath: string): Promise<boolean>;
}
