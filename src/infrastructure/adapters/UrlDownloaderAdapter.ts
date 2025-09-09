import { IUrlDownloader } from "../../domain/ports/IUrlDownloader";
import { UrlDownloader } from "../../utils/urlDownloader";

/**
 * Adapter para UrlDownloader
 * REUTILIZA o UrlDownloader existente - não recria nada
 */
export class UrlDownloaderAdapter implements IUrlDownloader {
  /**
   * Delega para o UrlDownloader existente
   */
  isValidUrl(url: string): boolean {
    return UrlDownloader.isValidUrl(url);
  }

  /**
   * Delega para o UrlDownloader existente
   */
  isValidImageUrl(url: string): boolean {
    return UrlDownloader.isValidImageUrl(url);
  }

  /**
   * Delega para o UrlDownloader existente
   */
  extractFilenameFromUrl(url: string): string {
    return UrlDownloader.extractFilenameFromUrl(url);
  }

  /**
   * Delega para o UrlDownloader existente
   */
  async downloadImage(url: string): Promise<{
    success: boolean;
    localPath?: string;
    originalUrl: string;
    error?: string;
  }> {
    const result = await UrlDownloader.downloadImage(url);
    return {
      success: result.success,
      localPath: result.localPath,
      originalUrl: result.originalUrl || url,
      error: result.error,
    };
  }

  /**
   * Delega para o UrlDownloader existente
   */
  async cleanupTempFiles(): Promise<void> {
    return await UrlDownloader.cleanupTempFiles();
  }
}
