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

    app = new App();
    await app.start(); // Start the server
    database = Database.getInstance();
    await database.connect();
  });

  afterAll(async () => {
    await database.clearDatabase();
    await database.disconnect();
    await app.stop(); // Stop the server
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

    it("should return 400 for missing imagePath", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
      expect(response.body.message).toBe("Image path is required");
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

    it("should return 500 for non-existent image file", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: "/non/existent/image.jpg" })
        .expect(500);

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
      const response = await request(app.getApp()).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Pixel Engine API is running");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("version");
    });
  });
});
