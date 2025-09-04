const { parentPort, workerData } = require("worker_threads");
const path = require("path");

// Import ImageProcessor - usa variável de ambiente para determinar o caminho
const isProduction =
  process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test";
const imageProcessorPath = isProduction
  ? path.resolve(__dirname, "../../dist/utils/imageProcessor")
  : path.resolve(__dirname, "../utils/imageProcessor");

const { ImageProcessor } = require(imageProcessorPath);

/**
 * Worker thread for processing images in the background
 * This worker receives task data and processes the image asynchronously
 */
async function processImage() {
  const startTime = Date.now();

  try {
    const { taskId, imagePath, originalPath, outputDir } = workerData;

    // Validate input data
    if (!taskId || !imagePath) {
      throw new Error("Missing required data: taskId and imagePath");
    }

    // Log processing start
    console.log(`[Worker] Starting image processing for task ${taskId}`);

    // Set default output directory if not provided
    const finalOutputDir = outputDir || path.join(process.cwd(), "output");

    // Validate image before processing
    const isValidImage = await ImageProcessor.validateImage(imagePath);
    if (!isValidImage) {
      throw new Error("Invalid image file or format not supported");
    }

    // Process the image using the existing ImageProcessor
    // Use originalPath for generating output paths, but imagePath for actual processing
    const images = await ImageProcessor.processImage(
      imagePath,
      finalOutputDir,
      undefined,
      originalPath
    );

    const processingTime = Date.now() - startTime;
    console.log(
      `[Worker] Image processing completed for task ${taskId} in ${processingTime}ms`
    );

    // Send success result back to main thread
    parentPort.postMessage({
      taskId,
      status: "completed",
      images: images,
      processedAt: new Date().toISOString(),
      processingTimeMs: processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(
      `[Worker] Image processing failed for task ${workerData?.taskId}:`,
      error.message
    );

    // Send error result back to main thread
    parentPort.postMessage({
      taskId: workerData?.taskId,
      status: "failed",
      error: error.message,
      processedAt: new Date().toISOString(),
      processingTimeMs: processingTime,
    });
  }
}

// Handle uncaught exceptions in worker
process.on("uncaughtException", (error) => {
  console.error("[Worker] Uncaught exception:", error);
  parentPort.postMessage({
    taskId: workerData?.taskId,
    status: "failed",
    error: `Uncaught exception: ${error.message}`,
    processedAt: new Date().toISOString(),
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("[Worker] Unhandled rejection:", reason);
  parentPort.postMessage({
    taskId: workerData?.taskId,
    status: "failed",
    error: `Unhandled rejection: ${reason}`,
    processedAt: new Date().toISOString(),
  });
});

// Start processing when worker is created
processImage();
