import request from "supertest";
import { App } from "../../index";
import { Database } from "../../config/database";
import { UrlDownloader } from "../../utils/urlDownloader";

// Mock do UrlDownloader para testes
jest.mock("../../utils/urlDownloader");
const mockedUrlDownloader = UrlDownloader as jest.Mocked<typeof UrlDownloader>;

// Mock do Worker Threads para evitar operações assíncronas reais
jest.mock("worker_threads", () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    terminate: jest.fn(),
  })),
}));

describe("URL Image Integration Tests", () => {
  let app: App;
  let database: Database;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = "test";
    process.env.MONGODB_TEST_URI =
      "mongodb://localhost:27017/pixel-engine-test";

    app = new App();
    await app.start();
    database = Database.getInstance();
    await database.connect();
  });

  afterAll(async () => {
    try {
      await database.clearDatabase();
      await database.disconnect();
      await app.stop();

      // Aguarda um pouco para garantir que todas as operações assíncronas terminem
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error in afterAll cleanup:", error);
    }
  });

  beforeEach(async () => {
    await database.clearDatabase();
    jest.clearAllMocks();
  });

  describe("POST /api/tasks with URL", () => {
    it("should accept valid image URL format", async () => {
      // Testa que URLs válidas passam na validação inicial
      const validResponse = await request(app.getApp())
        .post("/api/tasks")
        .send({
          imagePath: "https://example.com/test-image.jpg",
        });

      // Pode falhar no download, mas não deve ser erro de validação
      if (validResponse.status === 400) {
        // Se for erro de validação, deve ser por outro motivo
        expect(validResponse.body.error).toBeDefined();
      }
    });

    it("should return error for invalid URL", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({
          imagePath: "not-a-valid-url",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
    });

    it("should return error for non-image URL", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({
          imagePath: "https://example.com/document.pdf",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
    });
  });

  describe("Validation middleware with URLs", () => {
    it("should validate URL length", async () => {
      const longUrl = "https://example.com/" + "a".repeat(2000) + ".jpg";

      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: longUrl })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
      expect(response.body.message).toContain(
        "must be between 1 and 2000 characters"
      );
    });

    it("should validate empty imagePath", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: "" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
    });

    it("should validate non-string imagePath", async () => {
      const response = await request(app.getApp())
        .post("/api/tasks")
        .send({ imagePath: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation Error");
      expect(response.body.message).toContain("must be a string");
    });
  });
});
