import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { Database } from "./config/database";
import { config } from "./config/environment";
import { swaggerSpec } from "./config/swagger";
import { ErrorHandler } from "./middleware/errorHandler";
import { Logger } from "./utils/logger";
import taskRoutes from "./routes/taskRoutes";
import healthRoutes from "./routes/healthRoutes";

class App {
  private app: express.Application;
  private database: Database;

  constructor() {
    this.app = express();
    this.database = Database.getInstance();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging
    this.app.use((req, res, next) => {
      Logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use(`${config.apiPrefix}/tasks`, taskRoutes);
    this.app.use(`${config.apiPrefix}/health`, healthRoutes);

    // Swagger documentation
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Pixel Engine API Documentation",
      })
    );

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "Welcome to Pixel Engine API",
        documentation: "/api-docs",
        health: "/api/health",
        version: "1.0.0",
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use("*", ErrorHandler.notFound);

    // Global error handler
    this.app.use(ErrorHandler.handle);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.database.connect();

      // Start server
      this.app.listen(config.port, () => {
        Logger.info(`Server running on port ${config.port}`);
        Logger.info(
          `API Documentation: http://localhost:${config.port}/api-docs`
        );
        Logger.info(`Health Check: http://localhost:${config.port}/api/health`);
      });
    } catch (error) {
      Logger.error("Failed to start server", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.database.disconnect();
      Logger.info("Server stopped gracefully");
    } catch (error) {
      Logger.error("Error stopping server", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  Logger.info("Received SIGINT, shutting down gracefully");
  const app = new App();
  await app.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  Logger.info("Received SIGTERM, shutting down gracefully");
  const app = new App();
  await app.stop();
  process.exit(0);
});

// Export App class for testing
export { App };

// Start the application
const app = new App();
app.start().catch((error) => {
  Logger.error("Failed to start application", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});
