/**
 * Port para processamento de imagens
 * Baseado no ImageProcessor existente - mantém a mesma interface
 */
export interface IImageProcessor {
  /**
   * Valida se o arquivo é uma imagem válida
   */
  validateImage(imagePath: string): Promise<boolean>;

  /**
   * Valida se a URL é uma imagem válida
   */
  isValidImageUrl(url: string): boolean;

  /**
   * Valida se o caminho é um arquivo local válido
   */
  isValidLocalPath(path: string): boolean;

  /**
   * Gera um preço aleatório para a tarefa
   */
  generateRandomPrice(): number;
}
