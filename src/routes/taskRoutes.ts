import { Router } from "express";
import { TaskController } from "../controllers/TaskController";
import { ValidationMiddleware } from "../middleware/validation";
import { uploadSingle } from "../middleware/upload";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - imagePath
 *       properties:
 *         imagePath:
 *           type: string
 *           description: Path to the original image file
 *           example: "/path/to/image.jpg"
 *
 *     CreateTaskResponse:
 *       type: object
 *       properties:
 *         taskId:
 *           type: string
 *           description: Unique identifier for the task
 *           example: "65d4a54b89c5e342b2c2c5f6"
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *           description: Current status of the task
 *           example: "pending"
 *         price:
 *           type: number
 *           description: Price assigned to the task
 *           example: 25.5
 *
 *     ImageVariant:
 *       type: object
 *       properties:
 *         resolution:
 *           type: string
 *           description: Image resolution
 *           example: "1024"
 *         path:
 *           type: string
 *           description: Path to the processed image
 *           example: "/output/image1/1024/f322b730b287da77e1c519c7ffef4fc2.jpg"
 *         md5:
 *           type: string
 *           description: MD5 hash of the processed image
 *           example: "f322b730b287da77e1c519c7ffef4fc2"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *
 *     GetTaskResponse:
 *       type: object
 *       properties:
 *         taskId:
 *           type: string
 *           description: Unique identifier for the task
 *           example: "65d4a54b89c5e342b2c2c5f6"
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *           description: Current status of the task
 *           example: "completed"
 *         price:
 *           type: number
 *           description: Price assigned to the task
 *           example: 25.5
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ImageVariant'
 *           description: Processed image variants (only present when status is completed)
 *         error:
 *           type: string
 *           description: Error message (only present when status is failed)
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the request was successful
 *         data:
 *           type: object
 *           description: Response data
 *         message:
 *           type: string
 *           description: Response message
 *         error:
 *           type: string
 *           description: Error message (only present when success is false)
 */

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new image processing task
 *     description: |
 *       Creates a task to process an image and generate variants in different resolutions.
 *
 *       **📋 UPLOAD METHODS - Choose one:**
 *
 *       **🔹 Method 1: JSON Upload (File Path)**
 *       - Use `Content-Type: application/json`
 *       - Provide local file path in request body
 *       - File must exist on the server
 *       - Faster processing (no file transfer)
 *
 *       **🔹 Method 2: Multipart Upload (File Upload)**
 *       - Use `Content-Type: multipart/form-data`
 *       - Upload file directly from client
 *       - File is transferred to server
 *       - Supports client-side file selection
 *
 *       **✨ Features:**
 *       - Generates variants in 1024px and 800px resolutions
 *       - Prevents duplicate image processing
 *       - Assigns random price between 5-50 units
 *       - Processes images asynchronously using Worker Threads
 *
 *       **📝 Example Commands:**
 *
 *       **JSON Method:**
 *       ```bash
 *       curl -X POST http://localhost:3000/api/tasks \
 *         -H "Content-Type: application/json" \
 *         -d '{"imagePath": "/path/to/image.jpg"}'
 *       ```
 *
 *       **Multipart Method:**
 *       ```bash
 *       curl -X POST http://localhost:3000/api/tasks \
 *         -F "image=@/path/to/image.jpg"
 *       ```
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       description: |
 *         **Choose your upload method:**
 *
 *         **🔹 JSON Method:** Send file path as JSON
 *         **🔹 Multipart Method:** Upload file directly
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *           description: |
 *             **JSON Upload Method**
 *
 *             Send the local file path as JSON.
 *
 *             **Example:**
 *             ```json
 *             {
 *               "imagePath": "/path/to/your/image.jpg"
 *             }
 *             ```
 *
 *             **Requirements:**
 *             - File must exist on the server
 *             - Use absolute or relative path
 *             - Supported formats: jpg, jpeg, png, webp
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to process
 *           description: |
 *             **Multipart Upload Method**
 *
 *             Upload the image file directly from your client.
 *
 *             **Form Field:** `image`
 *
 *             **Requirements:**
 *             - File size limit: 10MB
 *             - Supported formats: jpg, jpeg, png, webp
 *             - File will be processed and temporary files cleaned up automatically
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CreateTaskResponse'
 *             examples:
 *               json_method:
 *                 summary: JSON Upload Method
 *                 description: Example using JSON with file path
 *                 value:
 *                   success: true
 *                   data:
 *                     taskId: "65d4a54b89c5e342b2c2c5f6"
 *                     status: "pending"
 *                     price: 25.5
 *                   message: "Task created successfully"
 *               multipart_method:
 *                 summary: Multipart Upload Method
 *                 description: Example using multipart file upload
 *                 value:
 *                   success: true
 *                   data:
 *                     taskId: "65d4a54b89c5e342b2c2c5f7"
 *                     status: "pending"
 *                     price: 32.1
 *                   message: "Task created successfully"
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post(
  "/",
  uploadSingle, // Middleware para upload de arquivo (opcional)
  ValidationMiddleware.validateCreateTask,
  TaskController.createTask
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Get task status and results
 *     description: Retrieves the status, price, and processed images for a specific task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the task
 *         example: "65d4a54b89c5e342b2c2c5f6"
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GetTaskResponse'
 *       400:
 *         description: Bad request - Invalid task ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get(
  "/:taskId",
  ValidationMiddleware.validateTaskId,
  TaskController.getTask
);

export default router;
