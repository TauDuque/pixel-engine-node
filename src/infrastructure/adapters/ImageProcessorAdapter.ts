import { IImageProcessor } from "../../domain/ports/IImageProcessor";
import { ImageProcessor } from "../../utils/imageProcessor";

/**
 * Adapter para ImageProcessor
 * REUTILIZA o ImageProcessor existente - não recria nada
 */
export class ImageProcessorAdapter implements IImageProcessor {
  /**
   * Delega para o ImageProcessor existente
   */
  async validateImage(imagePath: string): Promise<boolean> {
    return await ImageProcessor.validateImage(imagePath);
  }

  /**
   * Delega para o ImageProcessor existente
   */
  isValidImageUrl(url: string): boolean {
    return ImageProcessor.isValidImageUrl(url);
  }

  /**
   * Delega para o ImageProcessor existente
   */
  isValidLocalPath(path: string): boolean {
    return ImageProcessor.isValidLocalPath(path);
  }

  /**
   * Delega para o ImageProcessor existente
   */
  isValidImageSource(source: string): boolean {
    return ImageProcessor.isValidImageSource(source);
  }

  /**
   * Delega para o ImageProcessor existente
   */
  generateRandomPrice(): number {
    return ImageProcessor.generateRandomPrice();
  }
}
