import { TaskService } from "../../services/TaskService";
import { TaskModel } from "../../models/Task";
import { ImageModel } from "../../models/Image";
import { ImageProcessor } from "../../utils/imageProcessor";
import { Logger } from "../../utils/logger";
import { Worker } from "worker_threads";
import path from "path";

// Mock worker_threads
jest.mock("worker_threads", () => ({
  Worker: jest.fn(),
}));

// Mock ImageProcessor
jest.mock("../../utils/imageProcessor", () => ({
  ImageProcessor: {
    validateImage: jest.fn(),
    generateRandomPrice: jest.fn(),
    processImage: jest.fn(),
  },
}));

// Mock Logger
jest.mock("../../utils/logger", () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock models
jest.mock("../../models/Task", () => ({
  TaskModel: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock("../../models/Image", () => ({
  ImageModel: {
    insertMany: jest.fn(),
  },
}));

describe("TaskService Unit Tests", () => {
  const mockWorker = {
    on: jest.fn(),
    terminate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Worker as jest.Mock).mockImplementation(() => mockWorker);
  });

  describe("createTask", () => {
    it("should create a task and start worker thread", async () => {
      // Arrange
      const mockTask = {
        _id: "507f1f77bcf86cd799439011",
        status: "pending",
        price: 25.5,
        originalPath: "/test/image.jpg",
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          status: "pending",
          price: 25.5,
        }),
      };

      (ImageProcessor.validateImage as jest.Mock).mockResolvedValue(true);
      (ImageProcessor.generateRandomPrice as jest.Mock).mockReturnValue(25.5);
      (TaskModel as any).mockImplementation(() => mockTask);

      // Act
      const result = await TaskService.createTask({
        imagePath: "/test/image.jpg",
      });

      // Assert
      expect(result).toEqual({
        taskId: "507f1f77bcf86cd799439011",
        status: "pending",
        price: 25.5,
      });

      expect(ImageProcessor.validateImage).toHaveBeenCalledWith(
        "/test/image.jpg"
      );
      expect(ImageProcessor.generateRandomPrice).toHaveBeenCalled();
      expect(Worker).toHaveBeenCalledWith(
        expect.stringContaining("imageProcessorWorker.js"),
        {
          workerData: {
            taskId: "507f1f77bcf86cd799439011",
            imagePath: "/test/image.jpg",
            outputDir: expect.any(String),
          },
        }
      );
      expect(mockWorker.on).toHaveBeenCalledWith(
        "message",
        expect.any(Function)
      );
      expect(mockWorker.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockWorker.on).toHaveBeenCalledWith("exit", expect.any(Function));
    });

    it("should throw error for invalid image", async () => {
      // Arrange
      (ImageProcessor.validateImage as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        TaskService.createTask({ imagePath: "/invalid/image.jpg" })
      ).rejects.toThrow("Invalid image file or format not supported");

      expect(ImageProcessor.validateImage).toHaveBeenCalledWith(
        "/invalid/image.jpg"
      );
      expect(Worker).not.toHaveBeenCalled();
    });

    it("should handle worker creation error", async () => {
      // Arrange
      const mockTask = {
        _id: "507f1f77bcf86cd799439011",
        status: "pending",
        price: 25.5,
        originalPath: "/test/image.jpg",
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          status: "pending",
          price: 25.5,
        }),
      };

      (ImageProcessor.validateImage as jest.Mock).mockResolvedValue(true);
      (ImageProcessor.generateRandomPrice as jest.Mock).mockReturnValue(25.5);
      (TaskModel as any).mockImplementation(() => mockTask);
      (Worker as jest.Mock).mockImplementation(() => {
        throw new Error("Worker creation failed");
      });

      // Act
      const result = await TaskService.createTask({
        imagePath: "/test/image.jpg",
      });

      // Assert
      expect(result).toEqual({
        taskId: "507f1f77bcf86cd799439011",
        status: "pending",
        price: 25.5,
      });

      expect(Logger.error).toHaveBeenCalledWith(
        "Error creating worker thread",
        expect.objectContaining({
          taskId: "507f1f77bcf86cd799439011",
          error: "Worker creation failed",
        })
      );
    });
  });

  describe("getTask", () => {
    it("should return task details", async () => {
      // Arrange
      const mockTask = {
        _id: "507f1f77bcf86cd799439011",
        status: "completed",
        price: 25.5,
        images: [
          {
            resolution: "1024",
            path: "/output/test/1024/image.jpg",
            md5: "abc123",
            createdAt: new Date(),
          },
        ],
        error: null,
      };

      (TaskModel.findById as jest.Mock).mockResolvedValue(mockTask);

      // Act
      const result = await TaskService.getTask("507f1f77bcf86cd799439011");

      // Assert
      expect(result).toEqual({
        taskId: "507f1f77bcf86cd799439011",
        status: "completed",
        price: 25.5,
        images: mockTask.images,
        error: null,
      });

      expect(TaskModel.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
    });

    it("should throw error for non-existent task", async () => {
      // Arrange
      (TaskModel.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        TaskService.getTask("507f1f77bcf86cd799439011")
      ).rejects.toThrow("Task not found");

      expect(TaskModel.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
    });
  });

  describe("worker message handling", () => {
    it("should handle worker success message", async () => {
      // Arrange
      const mockTask = {
        _id: "507f1f77bcf86cd799439011",
        status: "pending",
        price: 25.5,
        originalPath: "/test/image.jpg",
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          status: "pending",
          price: 25.5,
        }),
      };

      const mockImages = [
        {
          resolution: "1024",
          path: "/output/test/1024/image.jpg",
          md5: "abc123",
        },
      ];

      (ImageProcessor.validateImage as jest.Mock).mockResolvedValue(true);
      (ImageProcessor.generateRandomPrice as jest.Mock).mockReturnValue(25.5);
      (TaskModel as any).mockImplementation(() => mockTask);
      (TaskModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (ImageModel.insertMany as jest.Mock).mockResolvedValue({});

      // Act
      await TaskService.createTask({ imagePath: "/test/image.jpg" });

      // Simulate worker success message
      const messageHandler = mockWorker.on.mock.calls.find(
        (call) => call[0] === "message"
      )[1];

      await messageHandler({
        status: "completed",
        images: mockImages,
        processedAt: new Date().toISOString(),
      });

      // Assert
      expect(TaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {
          status: "completed",
          images: expect.arrayContaining([
            expect.objectContaining({
              resolution: "1024",
              path: "/output/test/1024/image.jpg",
              md5: "abc123",
            }),
          ]),
          updatedAt: expect.any(Date),
        }
      );

      expect(ImageModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            path: "/output/test/1024/image.jpg",
            resolution: "1024",
            md5: "abc123",
            originalPath: "/test/image.jpg",
            taskId: expect.any(Object),
          }),
        ])
      );

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it("should handle worker error message", async () => {
      // Arrange
      const mockTask = {
        _id: "507f1f77bcf86cd799439011",
        status: "pending",
        price: 25.5,
        originalPath: "/test/image.jpg",
        save: jest.fn().mockResolvedValue({
          _id: "507f1f77bcf86cd799439011",
          status: "pending",
          price: 25.5,
        }),
      };

      (ImageProcessor.validateImage as jest.Mock).mockResolvedValue(true);
      (ImageProcessor.generateRandomPrice as jest.Mock).mockReturnValue(25.5);
      (TaskModel as any).mockImplementation(() => mockTask);
      (TaskModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // Act
      await TaskService.createTask({ imagePath: "/test/image.jpg" });

      // Simulate worker error message
      const messageHandler = mockWorker.on.mock.calls.find(
        (call) => call[0] === "message"
      )[1];

      await messageHandler({
        status: "failed",
        error: "Processing failed",
        processedAt: new Date().toISOString(),
      });

      // Assert
      expect(TaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        {
          status: "failed",
          error: "Processing failed",
          updatedAt: expect.any(Date),
        }
      );

      expect(mockWorker.terminate).toHaveBeenCalled();
    });
  });
});
