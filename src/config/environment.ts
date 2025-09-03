import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(
    process.env.PORT || (process.env.NODE_ENV === "test" ? "0" : "3000"),
    10
  ),
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/pixel-engine",
  mongodbTestUri:
    process.env.MONGODB_TEST_URI ||
    "mongodb://localhost:27017/pixel-engine-test",

  // File Upload
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  outputDir: process.env.OUTPUT_DIR || "output",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB

  // Image Processing
  supportedFormats: (
    process.env.SUPPORTED_FORMATS || "jpg,jpeg,png,webp"
  ).split(","),
  resolutions: (process.env.RESOLUTIONS || "1024,800").split(",").map(Number),

  // API
  apiVersion: process.env.API_VERSION || "v1",
  apiPrefix: process.env.API_PREFIX || "/api",
} as const;
