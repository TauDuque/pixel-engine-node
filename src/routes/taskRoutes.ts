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
 *     description: Creates a task to process an image and generate variants in different resolutions
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to process
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
