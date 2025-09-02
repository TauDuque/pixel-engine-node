import { Database } from "../config/database";

// Setup global test configuration
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = "test";
  process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/pixel-engine-test";

  // Connect to test database
  const database = Database.getInstance();
  await database.connect();
});

afterAll(async () => {
  // Clean up test database and disconnect
  const database = Database.getInstance();
  await database.clearDatabase();
  await database.disconnect();
});

afterEach(async () => {
  // Clear database after each test
  const database = Database.getInstance();
  await database.clearDatabase();
});
