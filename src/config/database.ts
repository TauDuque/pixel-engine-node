import mongoose from "mongoose";
import { config } from "./environment";

export class Database {
  private static instance: Database;
  private connected = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.connected) {
      console.log("Database already connected");
      return;
    }

    try {
      const mongoUri =
        config.nodeEnv === "test" ? config.mongodbTestUri : config.mongodbUri;

      await mongoose.connect(mongoUri);
      this.connected = true;
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.connected = false;
      console.log("Disconnected from MongoDB");
    } catch (error) {
      console.error("MongoDB disconnection error:", error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async clearDatabase(): Promise<void> {
    if (config.nodeEnv !== "test") {
      throw new Error("clearDatabase can only be used in test environment");
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}
