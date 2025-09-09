/**
 * Port para download de imagens de URLs
 * Baseado no UrlDownloader existente - mantém a mesma interface
 */
export interface IUrlDownloader {
  /**
   * Valida se a URL é válida
   */
  isValidUrl(url: string): boolean;

  /**
   * Valida se a URL é uma imagem válida
   */
  isValidImageUrl(url: string): boolean;

  /**
   * Extrai o nome do arquivo da URL
   */
  extractFilenameFromUrl(url: string): string;

  /**
   * Faz download da imagem da URL
   */
  downloadImage(url: string): Promise<{
    success: boolean;
    localPath?: string;
    originalUrl: string;
    error?: string;
  }>;

  /**
   * Limpa arquivos temporários
   */
  cleanupTempFiles(): Promise<void>;
}
