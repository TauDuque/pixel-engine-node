export interface TaskStatus {
  PENDING: "pending";
  COMPLETED: "completed";
  FAILED: "failed";
}

export type TaskStatusType = TaskStatus[keyof TaskStatus];

export interface ImageVariant {
  resolution: string;
  path: string;
  md5: string;
  createdAt: Date;
}

export interface Task {
  _id?: string;
  status: TaskStatusType;
  price: number;
  originalPath: string;
  images: ImageVariant[];
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface CreateTaskRequest {
  imagePath: string;
}

export interface CreateTaskResponse {
  taskId: string;
  status: TaskStatusType;
  price: number;
}

export interface GetTaskResponse {
  taskId: string;
  status: TaskStatusType;
  price: number;
  images?: ImageVariant[];
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}
