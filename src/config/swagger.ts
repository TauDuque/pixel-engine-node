import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./environment";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pixel Engine API",
      version: "1.0.0",
      description:
        "API REST para procesado de imágenes y consulta de tareas con Arquitectura Hexagonal. " +
        "Funcionalidades: Procesamiento asíncrono de imágenes usando Worker Threads, " +
        "generación de variantes en resoluciones 1024px y 800px, sistema de precios dinámico (5-50 unidades monetarias), " +
        "prevención de imágenes duplicadas, soporte para upload JSON (path local/URL) y multipart (archivo), " +
        "gestión de errores centralizada, documentación completa con Swagger/OpenAPI, " +
        "Arquitectura Hexagonal con separación clara de responsabilidades. " +
        "Arquitectura: Implementación única con Arquitectura Hexagonal (/api/tasks) usando Ports & Adapters, " +
        "reutilización de servicios existentes através de adapters, separación clara de responsabilidades. " +
        "Repository: https://github.com/TauDuque/pixel-engine-node.git",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
      license: {
        name: "Technical Assessment",
        url: "https://github.com/TauDuque/pixel-engine-node.git",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Tasks",
        description:
          "Image processing tasks management with Hexagonal Architecture",
      },
      {
        name: "Health",
        description: "API health and status endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Caminho para os arquivos com anotações Swagger
};

export const swaggerSpec = swaggerJsdoc(options);
