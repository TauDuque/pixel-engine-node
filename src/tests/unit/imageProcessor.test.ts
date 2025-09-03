import { ImageProcessor } from "../../utils/imageProcessor";
import fs from "fs-extra";
import path from "path";

describe("ImageProcessor Unit Tests", () => {
  const testDir = path.join(__dirname, "../fixtures");
  const testImagePath = path.join(testDir, "more.png");

  beforeAll(async () => {
    // Create test directory if it doesn't exist
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    // Clean up test files (but keep the fixtures directory)
    // Only remove temporary files created during tests
    const outputDir = path.join(testDir, "output");
    if (await fs.pathExists(outputDir)) {
      await fs.remove(outputDir);
    }
  });

  describe("generateRandomPrice", () => {
    it("should generate a price between 5 and 50", () => {
      const price = ImageProcessor.generateRandomPrice();
      expect(price).toBeGreaterThanOrEqual(5);
      expect(price).toBeLessThanOrEqual(50);
      expect(typeof price).toBe("number");
    });

    it("should generate different prices on multiple calls", () => {
      const prices = Array.from({ length: 10 }, () =>
        ImageProcessor.generateRandomPrice()
      );
      const uniquePrices = new Set(prices);
      // With 10 calls, we should have some variation (not all the same)
      expect(uniquePrices.size).toBeGreaterThan(1);
    });
  });

  describe("validateImage", () => {
    it("should return true for valid JPEG file", async () => {
      const isValid = await ImageProcessor.validateImage(testImagePath);
      expect(isValid).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      const isValid = await ImageProcessor.validateImage(
        "/non/existent/file.jpg"
      );
      expect(isValid).toBe(false);
    });

    it("should return false for unsupported file format", async () => {
      const txtFile = path.join(testDir, "test.txt");
      await fs.writeFile(txtFile, "This is not an image");

      const isValid = await ImageProcessor.validateImage(txtFile);
      expect(isValid).toBe(false);

      await fs.remove(txtFile);
    });
  });

  describe("processImage", () => {
    const outputDir = path.join(testDir, "output");

    afterEach(async () => {
      // Clean up output directory after each test
      if (await fs.pathExists(outputDir)) {
        await fs.remove(outputDir);
      }
    });

    it("should process image and create variants", async () => {
      const results = await ImageProcessor.processImage(
        testImagePath,
        outputDir
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Check that each result has required properties
      results.forEach((result) => {
        expect(result).toHaveProperty("resolution");
        expect(result).toHaveProperty("path");
        expect(result).toHaveProperty("md5");
        expect(typeof result.resolution).toBe("string");
        expect(typeof result.path).toBe("string");
        expect(typeof result.md5).toBe("string");
      });

      // Check that files were actually created
      for (const result of results) {
        expect(await fs.pathExists(result.path)).toBe(true);
      }
    });

    it("should throw error for non-existent input file", async () => {
      await expect(
        ImageProcessor.processImage("/non/existent/file.jpg", outputDir)
      ).rejects.toThrow("Input file does not exist");
    });
  });
});
