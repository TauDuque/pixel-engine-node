import { Database } from "../config/database";

// Global setup para todos os testes
export default async function globalSetup() {
  // Set test environment
  process.env.NODE_ENV = "test";
  process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/pixel-engine-test";

  // Connect to test database once
  const database = Database.getInstance();
  await database.connect();

  console.log("Global test setup completed - MongoDB connected");
}
