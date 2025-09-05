import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./environment";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pixel Engine API",
      version: "1.0.0",
      description: `
        API REST para procesado de imágenes y consulta de tareas.
        
        **Funcionalidades:**
        - Procesamiento asíncrono de imágenes usando Worker Threads
        - Generación de variantes en resoluciones 1024px y 800px
        - Sistema de precios dinámico (5-50 unidades monetarias)
        - Prevención de imágenes duplicadas
        - Soporte para upload JSON (path local) y multipart (archivo)
        - Gestión de errores centralizada
        - Documentación completa con Swagger/OpenAPI
        
        **Repository:** [pixel-engine-node](https://github.com/TauDuque/pixel-engine-node.git)
      `,
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
        description: "Image processing tasks management",
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
