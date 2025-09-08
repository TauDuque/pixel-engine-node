import { UrlDownloader } from "../../utils/urlDownloader";
import fs from "fs-extra";
import path from "path";

// Mock do fs-extra
jest.mock("fs-extra");
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock do https e http
jest.mock("https");
jest.mock("http");

describe("UrlDownloader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isValidUrl", () => {
    it("should return true for valid HTTP URLs", () => {
      expect(UrlDownloader.isValidUrl("http://example.com/image.jpg")).toBe(
        true
      );
      expect(UrlDownloader.isValidUrl("https://example.com/image.png")).toBe(
        true
      );
    });

    it("should return false for invalid URLs", () => {
      expect(UrlDownloader.isValidUrl("not-a-url")).toBe(false);
      expect(UrlDownloader.isValidUrl("ftp://example.com/image.jpg")).toBe(
        false
      );
      expect(UrlDownloader.isValidUrl("")).toBe(false);
    });
  });

  describe("isValidImageUrl", () => {
    it("should return true for valid image URLs", () => {
      expect(
        UrlDownloader.isValidImageUrl("https://example.com/image.jpg")
      ).toBe(true);
      expect(
        UrlDownloader.isValidImageUrl("https://example.com/image.jpeg")
      ).toBe(true);
      expect(
        UrlDownloader.isValidImageUrl("https://example.com/image.png")
      ).toBe(true);
      expect(
        UrlDownloader.isValidImageUrl("https://example.com/image.webp")
      ).toBe(true);
    });

    it("should return false for non-image URLs", () => {
      expect(
        UrlDownloader.isValidImageUrl("https://example.com/document.pdf")
      ).toBe(false);
      expect(
        UrlDownloader.isValidImageUrl("https://example.com/video.mp4")
      ).toBe(false);
      expect(UrlDownloader.isValidImageUrl("not-a-url")).toBe(false);
    });
  });

  describe("extractFilenameFromUrl", () => {
    it("should extract filename from URL", () => {
      expect(
        UrlDownloader.extractFilenameFromUrl(
          "https://example.com/path/image.jpg"
        )
      ).toBe("image.jpg");
      expect(
        UrlDownloader.extractFilenameFromUrl(
          "https://example.com/path/to/image.png"
        )
      ).toBe("image.png");
    });

    it("should generate timestamp-based filename for invalid URLs", () => {
      const filename = UrlDownloader.extractFilenameFromUrl("invalid-url");
      expect(filename).toMatch(/^downloaded_image_\d+\.jpg$/);
    });

    it("should generate timestamp-based filename for URLs without extension", () => {
      const filename = UrlDownloader.extractFilenameFromUrl(
        "https://example.com/path"
      );
      expect(filename).toMatch(/^downloaded_image_\d+\.jpg$/);
    });
  });

  describe("downloadImage", () => {
    it("should return error for invalid URL", async () => {
      const result = await UrlDownloader.downloadImage("invalid-url");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid URL or unsupported image format");
      expect(result.originalUrl).toBe("invalid-url");
    });

    it("should return error for non-image URL", async () => {
      const result = await UrlDownloader.downloadImage(
        "https://example.com/document.pdf"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid URL or unsupported image format");
      expect(result.originalUrl).toBe("https://example.com/document.pdf");
    });

    it("should handle download errors gracefully", async () => {
      // Mock para simular erro de download
      const mockHttps = require("https");
      mockHttps.get.mockImplementation(
        (url: string, options: any, callback: any) => {
          const mockResponse = {
            statusCode: 404,
            statusMessage: "Not Found",
            headers: { "content-type": "text/html" },
            pipe: jest.fn(),
            on: jest.fn(),
          };
          callback(mockResponse);
          return {
            on: jest.fn(),
          };
        }
      );

      const result = await UrlDownloader.downloadImage(
        "https://example.com/nonexistent.jpg"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("HTTP 404");
    });
  });

  describe("cleanupTempFiles", () => {
    it("should clean up temporary files", async () => {
      (mockedFs.pathExists as jest.Mock).mockResolvedValue(true);
      (mockedFs.remove as jest.Mock).mockResolvedValue(undefined);

      await UrlDownloader.cleanupTempFiles();

      expect(mockedFs.pathExists).toHaveBeenCalledWith(
        expect.stringContaining("temp/downloads")
      );
      expect(mockedFs.remove).toHaveBeenCalled();
    });

    it("should handle cleanup errors gracefully", async () => {
      (mockedFs.pathExists as jest.Mock).mockRejectedValue(
        new Error("Permission denied")
      );

      // Não deve lançar erro
      await expect(UrlDownloader.cleanupTempFiles()).resolves.not.toThrow();
    });
  });
});
