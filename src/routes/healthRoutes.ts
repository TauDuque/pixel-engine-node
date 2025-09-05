import { Router } from "express";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the API is running
 *           example: true
 *         message:
 *           type: string
 *           description: Health status message
 *           example: "Pixel Engine API is running"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Current server timestamp
 *           example: "2024-01-01T12:00:00.000Z"
 *         version:
 *           type: string
 *           description: API version
 *           example: "1.0.0"
 *         uptime:
 *           type: number
 *           description: Server uptime in seconds
 *           example: 3600
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         description: API is not healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Pixel Engine API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: process.uptime(),
  });
});

export default router;
