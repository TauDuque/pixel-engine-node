# Pixel Engine API

A high-performance REST API for image processing and task management, built with Node.js and TypeScript.

**Repository**: [pixel-engine-node](https://github.com/TauDuque/pixel-engine-node.git)

## Overview

This API provides:

- **Asynchronous image processing** using Worker Threads for optimal performance
- **Task creation and management** with real-time status tracking
- **Automatic generation** of image variants in specific resolutions (1024px and 800px)
- **Dynamic pricing system** for processing tasks (5-50 units)
- **Duplicate image prevention** to avoid unnecessary reprocessing
- **Enhanced API responses** with comprehensive feedback for developers
- **Robust error handling** and validation

## Architecture

The project was designed with **Hexagonal Architecture principles** in mind, implementing a **layered architecture** with clear separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and coordinate Worker Threads
- **Models**: Define MongoDB schemas with optimized indexes
- **Utils**: Helper functions (image processing, logging)
- **Workers**: Background processing using Node.js Worker Threads
- **Middleware**: Validation, error handling
- **Config**: Database configuration, environment, Swagger

### Architectural Approach

While the project was designed with **Hexagonal Architecture principles** in mind, the implementation follows a **pragmatic layered architecture** approach. This decision was made to:

- **Prioritize functionality** and meet all technical requirements
- **Ensure maintainability** with clear separation of concerns
- **Optimize development time** while maintaining code quality
- **Focus on business value** rather than theoretical perfection

The architecture successfully implements:

- **Separation of concerns** between layers
- **Clean interfaces** between components
- **Testable code** with proper mocking strategies
- **Scalable design** that can evolve toward full hexagonal implementation

### Asynchronous Processing

The API uses **Node.js Worker Threads** for image processing to ensure:

- **Non-blocking operations**: Main thread remains responsive
- **Scalability**: Multiple images can be processed concurrently
- **Error isolation**: Worker failures don't affect the main application
- **Performance**: CPU-intensive tasks run in separate threads

## Technologies

- **Node.js** with **TypeScript**
- **Express.js** as web framework
- **MongoDB** with **Mongoose** for persistence
- **Sharp** for image processing
- **Worker Threads** for asynchronous processing
- **Swagger/OpenAPI** for documentation
- **Jest** for testing
- **ESLint** for code quality

## Installation

1. Clone the repository:

```bash
git clone https://github.com/TauDuque/pixel-engine-node.git
cd pixel-engine-node
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp env.example .env
```

Edit the `.env` file with your configurations:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pixel-engine
MONGODB_TEST_URI=mongodb://localhost:27017/pixel-engine-test
UPLOAD_DIR=uploads
OUTPUT_DIR=output
MAX_FILE_SIZE=10485760
SUPPORTED_FORMATS=jpg,jpeg,png,webp
RESOLUTIONS=1024,800
API_VERSION=v1
API_PREFIX=/api
```

4. Ensure MongoDB is running:

```bash
# With Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Check code
npm run lint

# Auto-fix issues
npm run lint:fix
```

## API Endpoints

### Enhanced Response Format

The API uses an enhanced response format that provides comprehensive feedback:

```json
{
  "success": true,
  "data": {
    /* actual response data */
  },
  "message": "Descriptive message about the operation"
}
```

This format offers several advantages:

- **Clear success indication**: `success` field immediately shows operation status
- **Structured data**: `data` field contains the actual response payload
- **Contextual messages**: `message` field provides additional information
- **Consistent error handling**: Failed operations follow the same structure
- **Developer-friendly**: Easy to parse and handle in client applications

### Create Task

The API supports two methods for creating tasks:

#### Method 1: JSON Upload (File Path)

```http
POST /api/tasks
Content-Type: application/json

{
  "imagePath": "/path/to/image.jpg"
}
```

#### Method 2: Multipart Upload (File Upload)

```http
POST /api/tasks
Content-Type: multipart/form-data

# Form field: image (file)
```

**Example using curl:**

```bash
# JSON method
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"imagePath": "/path/to/image.jpg"}'

# Multipart method
curl -X POST http://localhost:3000/api/tasks \
  -F "image=@/path/to/image.jpg"
```

**Response (both methods):**

```json
{
  "success": true,
  "data": {
    "taskId": "65d4a54b89c5e342b2c2c5f6",
    "status": "pending",
    "price": 25.5
  },
  "message": "Task created successfully"
}
```

**Validation Features:**

- **Duplicate Image Prevention**: The API prevents processing the same image multiple times across both upload methods
- **File Format Validation**: Only supported formats (jpg, jpeg, png, webp) are accepted
- **File Existence Check**: For JSON uploads, validates that the image file exists and is accessible
- **File Size Limit**: Maximum file size of 10MB for multipart uploads
- **Automatic Cleanup**: Temporary files from multipart uploads are automatically cleaned up after processing

**Upload Method Comparison:**

| Feature             | JSON Upload                 | Multipart Upload                   |
| ------------------- | --------------------------- | ---------------------------------- |
| **Input**           | File path (string)          | File upload (binary)               |
| **Use Case**        | Server-side file processing | Client-side file upload            |
| **File Location**   | Must exist on server        | Uploaded from client               |
| **Storage**         | Original path preserved     | Temporary file created             |
| **Cleanup**         | No cleanup needed           | Automatic cleanup after processing |
| **Duplicate Check** | Based on full file path     | Based on original filename         |
| **Performance**     | Faster (no upload)          | Slower (file transfer)             |

**Error Responses:**

```json
{
  "success": false,
  "error": "Image has already been processed. Please use a different image.",
  "message": "Failed to create task"
}
```

```json
{
  "success": false,
  "error": "Invalid image file or format not supported",
  "message": "Failed to create task"
}
```

### Get Task

```http
GET /api/tasks/{taskId}
```

**Response (completed):**

```json
{
  "success": true,
  "data": {
    "taskId": "65d4a54b89c5e342b2c2c5f6",
    "status": "completed",
    "price": 25.5,
    "images": [
      {
        "resolution": "1024",
        "path": "/output/image1/1024/f322b730b287da77e1c519c7ffef4fc2.jpg",
        "md5": "f322b730b287da77e1c519c7ffef4fc2",
        "createdAt": "2024-01-01T12:00:00.000Z"
      },
      {
        "resolution": "800",
        "path": "/output/image1/800/202fd8b3174a774bac24428e8cb230a1.jpg",
        "md5": "202fd8b3174a774bac24428e8cb230a1",
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  },
  "message": "Task retrieved successfully"
}
```

### Health Check

```http
GET /api/health
```

## Database Utilities

The project includes utility scripts for database management:

### Initialize Database with Sample Data

```bash
npm run db:init
```

This script:

- Connects to MongoDB
- Clears existing data
- Creates sample tasks with different statuses (completed, pending, failed)
- Creates sample images with proper relationships
- Provides task IDs for testing

### Clear Database

```bash
npm run db:clear
```

Removes all data from the database (useful for testing).

### Environment Setup

```bash
npm run setup
```

Creates a `.env` file based on `env.example` for easy configuration.

## Documentation

Complete API documentation is available at:

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI Spec**: http://localhost:3000/api-docs/swagger.json

## Project Structure

```
src/
├── config/          # Configuration (DB, environment, Swagger)
├── controllers/     # HTTP controllers
├── middleware/      # Middleware (validation, errors)
├── models/          # MongoDB models
├── routes/          # Route definitions
├── services/        # Business logic
├── tests/           # Unit and integration tests
├── types/           # TypeScript type definitions
├── utils/           # Utilities (image processing, logging)
├── workers/         # Worker Threads for background processing
└── index.ts         # Application entry point

scripts/
├── init-database.js # Database initialization script
└── setup-env.js     # Environment setup script
```

## Database

### `tasks` Collection

```json
{
  "_id": "65d4a54b89c5e342b2c2c5f6",
  "status": "completed",
  "price": 25.5,
  "originalPath": "/input/image1.jpg",
  "images": [
    {
      "resolution": "1024",
      "path": "/output/image1/1024/f322b730b287.jpg",
      "md5": "f322b730b287da77e1c519c7ffef4fc2",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:10:00.000Z"
}
```

### `images` Collection

```json
{
  "_id": "65d4a54b89c5e342b2c2c5f7",
  "path": "/output/image1/1024/f322b730b287.jpg",
  "resolution": "1024",
  "md5": "f322b730b287da77e1c519c7ffef4fc2",
  "originalPath": "/input/image1.jpg",
  "taskId": "65d4a54b89c5e342b2c2c5f6",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

## MongoDB Indexes

For query optimization, the following indexes have been created:

- `tasks`: `{ status: 1 }`, `{ createdAt: -1 }`, `{ _id: 1, status: 1 }`
- `images`: `{ taskId: 1 }`, `{ md5: 1 }`, `{ path: 1 }`, `{ resolution: 1 }`

## Error Handling

The API implements centralized error handling with:

- Input validation
- Consistent responses
- Detailed logging
- Appropriate HTTP status codes

## Testing

The project includes:

- **Unit tests**: For utilities and business logic
- **Integration tests**: For endpoints and complete flows
- **Coverage**: Code coverage reporting

### Manual Testing

You can test the API manually using the provided sample data:

1. **Initialize sample data**:

   ```bash
   npm run db:init
   ```

2. **Test with sample task IDs**:

   - Completed: `507f1f77bcf86cd799439011`
   - Pending: `507f1f77bcf86cd799439012`
   - Failed: `507f1f77bcf86cd799439013`

3. **Create a new task**:

   **JSON method:**

   ```bash
   curl -X POST http://localhost:3000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"imagePath": "src/tests/fixtures/more.png"}'
   ```

   **Multipart method:**

   ```bash
   curl -X POST http://localhost:3000/api/tasks \
     -F "image=@src/tests/fixtures/more.png"
   ```

4. **Check task status**:
   ```bash
   curl http://localhost:3000/api/tasks/{taskId}
   ```

## Design Decisions

### Architecture & Performance

1. **Hexagonal Architecture**: Clear separation of concerns and testability
2. **Worker Threads**: Asynchronous image processing using Node.js Worker Threads for optimal performance
3. **Non-blocking Operations**: Main thread remains responsive during image processing
4. **Error Isolation**: Worker failures don't affect the main application

### API Design

5. **Enhanced Response Format**: Structured responses with `success`, `data`, and `message` fields for better developer experience
6. **Consistent Error Handling**: All errors follow the same response structure
7. **API-First Documentation**: Swagger/OpenAPI from the start
8. **Dual Upload Support**: Both JSON (file path) and multipart (file upload) methods for maximum flexibility

### Data & Validation

9. **Robust Validation**: Input validation and error handling
10. **Database Optimization**: Indexes for efficient queries
11. **Structured Logging**: For debugging and monitoring
12. **Duplicate Prevention**: Cross-method duplicate image detection

### Developer Experience

13. **Utility Scripts**: Database initialization and environment setup scripts
14. **Comprehensive Testing**: Unit and integration tests with coverage
15. **TypeScript**: Type safety and better development experience

## About

This project is a technical test implementation demonstrating:

- **Professional Node.js/TypeScript development** with best practices
- **RESTful API design** with comprehensive documentation
- **Asynchronous processing** using Worker Threads
- **Database optimization** with MongoDB indexing
- **Comprehensive testing** with unit and integration tests
- **Clean architecture** following Hexagonal Architecture principles with layered design

**Repository**: [pixel-engine-node](https://github.com/TauDuque/pixel-engine-node.git)

**Technologies**: Node.js, TypeScript, Express.js, MongoDB, Sharp, Worker Threads, Swagger/OpenAPI, Jest

**License**: This project is part of a technical assessment and is not intended for commercial use.
