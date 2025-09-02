# Pixel Engine API

A high-performance REST API for image processing and task management, built with Node.js and TypeScript.

## Overview

This API provides:

- Image processing task creation and management
- Automatic generation of image variants in specific resolutions (1024px and 800px)
- Task status tracking and result retrieval
- Dynamic pricing system for processing tasks

## Architecture

The project follows **Hexagonal Architecture** (Ports and Adapters) with the following layers:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Models**: Define MongoDB schemas
- **Utils**: Helper functions (image processing, logging)
- **Middleware**: Validation, error handling
- **Config**: Database configuration, environment, Swagger

## Technologies

- **Node.js** with **TypeScript**
- **Express.js** as web framework
- **MongoDB** with **Mongoose** for persistence
- **Sharp** for image processing
- **Swagger/OpenAPI** for documentation
- **Jest** for testing
- **ESLint** for code quality

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pixel-engine
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

### Create Task

```http
POST /api/tasks
Content-Type: application/json

{
  "imagePath": "/path/to/image.jpg"
}
```

**Response:**

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
GET /health
```

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
└── index.ts         # Application entry point
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

## Design Decisions

1. **Hexagonal Architecture**: Clear separation of concerns and testability
2. **Asynchronous Processing**: Images are processed in the background
3. **Robust Validation**: Input validation and error handling
4. **API-First Documentation**: Swagger/OpenAPI from the start
5. **Database Optimization**: Indexes for efficient queries
6. **Structured Logging**: For debugging and monitoring

## Roadmap

- [ ] Implement authentication/authorization
- [ ] Add rate limiting
- [ ] Implement Redis caching
- [ ] Add metrics and monitoring
- [ ] Implement CI/CD pipeline
- [ ] Add more image formats
- [ ] Implement batch processing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
