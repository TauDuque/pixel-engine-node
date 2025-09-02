import mongoose, { Document, Schema } from "mongoose";
import { Task as ITask, TaskStatusType } from "../types";

export interface TaskDocument extends Omit<ITask, "_id">, Document {}

const ImageVariantSchema = new Schema(
  {
    resolution: { type: String, required: true },
    path: { type: String, required: true },
    md5: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TaskSchema = new Schema<TaskDocument>(
  {
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPath: {
      type: String,
      required: true,
    },
    images: [ImageVariantSchema],
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "tasks",
  }
);

// Índices para otimização
TaskSchema.index({ status: 1 });
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ _id: 1, status: 1 });

export const TaskModel = mongoose.model<TaskDocument>("Task", TaskSchema);
