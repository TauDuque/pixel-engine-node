import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./environment";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pixel Engine API",
      version: "1.0.0",
      description: "API REST para procesado de imágenes y consulta de tareas",
      contact: {
        name: "API Support",
        email: "support@example.com",
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
    ],
  },
  apis: ["./src/routes/*.ts"], // Caminho para os arquivos com anotações Swagger
};

export const swaggerSpec = swaggerJsdoc(options);
