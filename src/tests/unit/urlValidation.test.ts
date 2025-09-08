import { ImageProcessor } from "../../utils/imageProcessor";
import { UrlDownloader } from "../../utils/urlDownloader";

describe("URL Validation Tests", () => {
  describe("ImageProcessor", () => {
    describe("isValidImageUrl", () => {
      it("should return true for valid image URLs", () => {
        expect(
          ImageProcessor.isValidImageUrl("https://example.com/image.jpg")
        ).toBe(true);
        expect(
          ImageProcessor.isValidImageUrl("https://example.com/image.jpeg")
        ).toBe(true);
        expect(
          ImageProcessor.isValidImageUrl("https://example.com/image.png")
        ).toBe(true);
        expect(
          ImageProcessor.isValidImageUrl("https://example.com/image.webp")
        ).toBe(true);
      });

      it("should return false for non-image URLs", () => {
        expect(
          ImageProcessor.isValidImageUrl("https://example.com/document.pdf")
        ).toBe(false);
        expect(
          ImageProcessor.isValidImageUrl("https://example.com/video.mp4")
        ).toBe(false);
        expect(ImageProcessor.isValidImageUrl("not-a-url")).toBe(false);
      });
    });

    describe("isValidLocalPath", () => {
      it("should return true for valid local paths", () => {
        expect(ImageProcessor.isValidLocalPath("/path/to/image.jpg")).toBe(
          true
        );
        expect(ImageProcessor.isValidLocalPath("C:\\path\\to\\image.png")).toBe(
          true
        );
        expect(
          ImageProcessor.isValidLocalPath("./relative/path/image.webp")
        ).toBe(true);
      });

      it("should return false for URLs", () => {
        expect(
          ImageProcessor.isValidLocalPath("https://example.com/image.jpg")
        ).toBe(false);
        expect(
          ImageProcessor.isValidLocalPath("http://example.com/image.png")
        ).toBe(false);
      });

      it("should return false for unsupported formats", () => {
        expect(ImageProcessor.isValidLocalPath("/path/to/document.pdf")).toBe(
          false
        );
        expect(ImageProcessor.isValidLocalPath("/path/to/video.mp4")).toBe(
          false
        );
      });

      it("should return false for invalid paths", () => {
        expect(ImageProcessor.isValidLocalPath("")).toBe(false);
        expect(ImageProcessor.isValidLocalPath("no-extension")).toBe(false);
        expect(
          ImageProcessor.isValidLocalPath("/path/without/extension/")
        ).toBe(false);
      });
    });

    describe("isValidImageSource", () => {
      it("should return true for valid URLs", () => {
        expect(
          ImageProcessor.isValidImageSource("https://example.com/image.jpg")
        ).toBe(true);
        expect(
          ImageProcessor.isValidImageSource("http://example.com/image.png")
        ).toBe(true);
      });

      it("should return true for valid local paths", () => {
        expect(ImageProcessor.isValidImageSource("/path/to/image.jpg")).toBe(
          true
        );
        expect(
          ImageProcessor.isValidImageSource("C:\\path\\to\\image.png")
        ).toBe(true);
      });

      it("should return false for invalid sources", () => {
        expect(
          ImageProcessor.isValidImageSource("https://example.com/document.pdf")
        ).toBe(false);
        expect(ImageProcessor.isValidImageSource("/path/to/document.pdf")).toBe(
          false
        );
        expect(ImageProcessor.isValidImageSource("not-a-valid-source")).toBe(
          false
        );
      });
    });
  });

  describe("UrlDownloader", () => {
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
  });
});
