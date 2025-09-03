const { parentPort, workerData } = require("worker_threads");
const { ImageProcessor } = require("../utils/imageProcessor");
const path = require("path");

/**
 * Worker thread for processing images in the background
 * This worker receives task data and processes the image asynchronously
 */
async function processImage() {
  try {
    const { taskId, imagePath, outputDir } = workerData;

    // Validate input data
    if (!taskId || !imagePath) {
      throw new Error("Missing required data: taskId and imagePath");
    }

    // Set default output directory if not provided
    const finalOutputDir = outputDir || path.join(process.cwd(), "output");

    // Process the image using the existing ImageProcessor
    const images = await ImageProcessor.processImage(imagePath, finalOutputDir);

    // Send success result back to main thread
    parentPort.postMessage({
      taskId,
      status: "completed",
      images: images,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Send error result back to main thread
    parentPort.postMessage({
      taskId: workerData?.taskId,
      status: "failed",
      error: error.message,
      processedAt: new Date().toISOString(),
    });
  }
}

// Start processing when worker is created
processImage();
