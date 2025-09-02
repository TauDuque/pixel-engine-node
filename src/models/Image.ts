import mongoose, { Document, Schema } from "mongoose";

export interface ImageDocument extends Document {
  path: string;
  resolution: string;
  md5: string;
  originalPath: string;
  taskId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<ImageDocument>(
  {
    path: {
      type: String,
      required: true,
      unique: true,
    },
    resolution: {
      type: String,
      required: true,
    },
    md5: {
      type: String,
      required: true,
    },
    originalPath: {
      type: String,
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "images",
  }
);

// Índices para otimização
ImageSchema.index({ taskId: 1 });
ImageSchema.index({ md5: 1 });
ImageSchema.index({ path: 1 });
ImageSchema.index({ resolution: 1 });

export const ImageModel = mongoose.model<ImageDocument>("Image", ImageSchema);
