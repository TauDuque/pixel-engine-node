// Mock do Worker Threads para evitar operações assíncronas reais
jest.mock("worker_threads", () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn((event, callback) => {
      // Simula o comportamento do worker sem executar operações reais
      if (event === "message") {
        // Simula uma resposta de sucesso com imagens processadas
        setTimeout(() => {
          callback({
            taskId: "mock-task-id",
            status: "completed",
            processingTimeMs: 100,
            images: [
              {
                resolution: "1024",
                path: `/output/more/1024/abc123def456_${Date.now()}.jpg`,
                md5: `abc123def456_${Date.now()}`,
                createdAt: new Date().toISOString(),
              },
              {
                resolution: "800",
                path: `/output/more/800/def456abc789_${Date.now()}.jpg`,
                md5: `def456abc789_${Date.now()}`,
                createdAt: new Date().toISOString(),
              },
            ],
            error: null,
          });
        }, 10); // Pequeno delay para simular processamento assíncrono
      }
    }),
    terminate: jest.fn(),
  })),
}));

import request from "supertest";
import { App } from "../../index";
import { Database } from "../../config/database";
import fs from "fs-extra";
import path from "path";

describe("Task Integration Tests", () => {
  let app: App;
  let database: Database;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = "test";
    process.env.MONGODB_TEST_URI =
      "mongodb://localhost:27017/pixel-engine-test";

    // Get database instance (don't connect again if already connected)
    database = Database.getInstance();
    if (!database.isConnected()) {
      await database.connect();
    }

    // Create and start app
    app = new App();
    await app.start();
  });

  afterAll(async () => {
    try {
      // Stop the server first
      if (app) {
        await app.stop();
      }

      // Clean database only if still connected
      if (database && database.isConnected()) {
        await database.clearDatabase();
      }

      // Aguarda um pouco para garantir que todas as operações assíncronas terminem
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      console.error("Error in afterAll cleanup:", error);
    }
  });

  beforeEach(async () => {
    await database.clearDatabase();
  });

  describe("POST /api/tasks", () => {
    it("should create a task with valid image path", async () => {
      const testImagePath = path.join(__dirname, "../fixtures/more.png");

      // Ensure test image exists
      if (!(await fs.pathExists(testImagePath))) {
        throw new Error(`Test image not found: ${testImagePath}`);
      }

      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: testImagePath })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("taskId");
      expect(response.body.data).toHaveProperty("status", "pending");
      expect(response.body.data).toHaveProperty("price");
      expect(typeof response.body.data.price).toBe("number");
      expect(response.body.data.price).toBeGreaterThanOrEqual(5);
      expect(response.body.data.price).toBeLessThanOrEqual(50);
    });

    it("should process image asynchronously and update task status", async () => {
      const testImagePath = path.join(__dirname, "../fixtures/more.png");

      // Ensure test image exists
      if (!(await fs.pathExists(testImagePath))) {
        throw new Error(`Test image not found: ${testImagePath}`);
      }

      // Create task
      const createResponse = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: testImagePath })
        .expect(201);

      const taskId = createResponse.body.data.taskId;

      // Wait for async processing to complete (max 10 seconds)
      let taskResponse;
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds max

      do {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms
        taskResponse = await request(app.getApp())
          .get(`/api/tasks/${taskId}`)
          .expect(200);
        attempts++;
      } while (
        taskResponse.body.data.status === "pending" &&
        attempts < maxAttempts
      );

      // Assert final status
      expect(taskResponse.body.data.status).toBe("completed");
      expect(taskResponse.body.data).toHaveProperty("images");
      expect(Array.isArray(taskResponse.body.data.images)).toBe(true);
      expect(taskResponse.body.data.images.length).toBeGreaterThan(0);

      // Check image structure
      taskResponse.body.data.images.forEach((image: any) => {
        expect(image).toHaveProperty("resolution");
        expect(image).toHaveProperty("path");
        expect(image).toHaveProperty("md5");
        expect(image).toHaveProperty("createdAt");

        // Check path format: /output/{name}/{resolution}/{md5}.jpg (with optional timestamp)
        expect(image.path).toMatch(/^\/output\/[^/]+\/\d+\/[a-f0-9_]+\.jpg$/);
      });
    }, 15000); // Increase timeout to 15 seconds for async processing

    it("should return 400 for missing imagePath", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
      expect(response.body.message).toBe(
        "Either imagePath (JSON - local path or URL) or file upload (multipart) is required"
      );
    });

    it("should return 400 for invalid imagePath type", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
      expect(response.body.message).toBe("Image path must be a string");
    });

    it("should return 400 for non-existent image file", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: "/non/existent/image.jpg" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Failed to create task");
    });
  });

  describe("GET /api/tasks/:taskId", () => {
    it("should return task details for valid taskId", async () => {
      // First create a task
      const testImagePath = path.join(__dirname, "../fixtures/more.png");

      if (!(await fs.pathExists(testImagePath))) {
        throw new Error(`Test image not found: ${testImagePath}`);
      }

      const createResponse = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: testImagePath })
        .expect(201);

      const taskId = createResponse.body.data.taskId;

      // Then get the task
      const response = await request(app.getApp())
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("taskId", taskId);
      expect(response.body.data).toHaveProperty("status");
      expect(response.body.data).toHaveProperty("price");
      expect(typeof response.body.data.price).toBe("number");
    });

    it("should return 404 for non-existent taskId", async () => {
      const fakeTaskId = "507f1f77bcf86cd799439011"; // Valid ObjectId format

      const response = await request(app.getApp())
        .get(`/api/tasks/${fakeTaskId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Task not found");
      expect(response.body.message).toBe("Task not found");
    });

    it("should return 400 for invalid taskId format", async () => {
      const response = await request(app.getApp())
        .get("/api/tasks/invalid-id")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
      expect(response.body.message).toBe("Invalid task ID format");
    });
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app.getApp())
        .get("/api/health")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Pixel Engine API is running");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("version");
    });
  });
});
