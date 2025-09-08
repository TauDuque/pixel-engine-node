import { Database } from "../config/database";

// Global teardown para todos os testes
export default async function globalTeardown() {
  // Clean and disconnect database
  const database = Database.getInstance();

  try {
    if (database.isConnected()) {
      await database.clearDatabase();
      await database.disconnect();
    }
  } catch (error) {
    console.error("Error in global teardown:", error);
  }

  console.log("Global test teardown completed - MongoDB disconnected");
}
