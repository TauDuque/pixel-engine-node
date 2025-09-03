const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs-extra");

// Import models
const { TaskModel } = require("../dist/models/Task");
const { ImageModel } = require("../dist/models/Image");

// Database connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pixel-engine";

async function initializeDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await TaskModel.deleteMany({});
    await ImageModel.deleteMany({});
    console.log("✅ Database cleared");

    // Create sample tasks
    console.log("📝 Creating sample tasks...");

    const sampleTasks = [
      {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        status: "completed",
        price: 25.5,
        originalPath: "/input/sample1.jpg",
        images: [
          {
            resolution: "1024",
            path: "/output/sample1/1024/f322b730b287da77e1c519c7ffef4fc2.jpg",
            md5: "f322b730b287da77e1c519c7ffef4fc2",
            createdAt: new Date("2024-06-01T12:00:00Z"),
          },
          {
            resolution: "800",
            path: "/output/sample1/800/202fd8b3174a774bac24428e8cb230a1.jpg",
            md5: "202fd8b3174a774bac24428e8cb230a1",
            createdAt: new Date("2024-06-01T12:00:00Z"),
          },
        ],
        createdAt: new Date("2024-06-01T12:00:00Z"),
        updatedAt: new Date("2024-06-01T12:10:00Z"),
      },
      {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
        status: "pending",
        price: 42.3,
        originalPath: "/input/sample2.png",
        images: [],
        createdAt: new Date("2024-06-01T13:00:00Z"),
        updatedAt: new Date("2024-06-01T13:00:00Z"),
      },
      {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439013"),
        status: "failed",
        price: 18.7,
        originalPath: "/input/sample3.jpg",
        images: [],
        error: "Invalid image format or corrupted file",
        createdAt: new Date("2024-06-01T14:00:00Z"),
        updatedAt: new Date("2024-06-01T14:05:00Z"),
      },
    ];

    await TaskModel.insertMany(sampleTasks);
    console.log("✅ Sample tasks created");

    // Create sample images
    console.log("🖼️ Creating sample images...");

    const sampleImages = [
      {
        path: "/output/sample1/1024/f322b730b287da77e1c519c7ffef4fc2.jpg",
        resolution: "1024",
        md5: "f322b730b287da77e1c519c7ffef4fc2",
        originalPath: "/input/sample1.jpg",
        taskId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        createdAt: new Date("2024-06-01T12:00:00Z"),
      },
      {
        path: "/output/sample1/800/202fd8b3174a774bac24428e8cb230a1.jpg",
        resolution: "800",
        md5: "202fd8b3174a774bac24428e8cb230a1",
        originalPath: "/input/sample1.jpg",
        taskId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        createdAt: new Date("2024-06-01T12:00:00Z"),
      },
    ];

    await ImageModel.insertMany(sampleImages);
    console.log("✅ Sample images created");

    // Display summary
    const taskCount = await TaskModel.countDocuments();
    const imageCount = await ImageModel.countDocuments();

    console.log("\n📊 Database Summary:");
    console.log(`   Tasks: ${taskCount}`);
    console.log(`   Images: ${imageCount}`);

    console.log("\n🎯 Sample Task IDs for testing:");
    console.log("   Completed: 507f1f77bcf86cd799439011");
    console.log("   Pending: 507f1f77bcf86cd799439012");
    console.log("   Failed: 507f1f77bcf86cd799439013");

    console.log("\n✅ Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
