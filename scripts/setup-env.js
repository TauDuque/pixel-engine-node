const fs = require("fs");
const path = require("path");

/**
 * Script para configurar variáveis de ambiente
 * Cria arquivo .env baseado no env.example
 */

function setupEnvironment() {
  const envExamplePath = path.join(__dirname, "..", "env.example");
  const envPath = path.join(__dirname, "..", ".env");

  try {
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      console.log("⚠️  .env file already exists. Skipping creation.");
      console.log(
        "   If you want to recreate it, delete the existing .env file first."
      );
      return;
    }

    // Check if env.example exists
    if (!fs.existsSync(envExamplePath)) {
      console.error("❌ env.example file not found!");
      process.exit(1);
    }

    // Read env.example and create .env
    const envExample = fs.readFileSync(envExamplePath, "utf8");
    fs.writeFileSync(envPath, envExample);

    console.log("✅ .env file created successfully!");
    console.log("📝 Please review and update the values in .env as needed.");
    console.log("🔧 Key variables to check:");
    console.log(
      "   - MONGODB_URI (default: mongodb://localhost:27017/pixel-engine)"
    );
    console.log("   - PORT (default: 3000)");
    console.log("   - NODE_ENV (default: development)");
  } catch (error) {
    console.error("❌ Error setting up environment:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupEnvironment();
}

module.exports = { setupEnvironment };
