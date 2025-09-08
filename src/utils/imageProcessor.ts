import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import fs from "fs-extra";
import { config } from "../config/environment";
import { UrlDownloader } from "./urlDownloader";

export class ImageProcessor {
  /**
   * Processa uma imagem criando variantes nas resoluções especificadas
   */
  public static async processImage(
    inputPath: string,
    outputBasePath: string,
    resolutions: number[] = config.resolutions,
    originalName?: string
  ): Promise<
    Array<{
      resolution: string;
      path: string;
      md5: string;
      originalName: string;
    }>
  > {
    try {
      // Verifica se o arquivo de entrada existe
      if (!(await fs.pathExists(inputPath))) {
        throw new Error(`Input file does not exist: ${inputPath}`);
      }

      // Lê a imagem original
      const imageBuffer = await fs.readFile(inputPath);
      const originalMd5 = crypto
        .createHash("md5")
        .update(imageBuffer)
        .digest("hex");

      // Obtém metadados da imagem
      const metadata = await sharp(imageBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("Unable to read image metadata");
      }

      // Cria o diretório base de saída
      let baseName: string;
      if (originalName) {
        // Se originalName é um caminho completo, extrai apenas o nome do arquivo
        baseName = path.parse(originalName).name;
      } else {
        // Caso contrário, usa o nome do arquivo do inputPath
        baseName = path.parse(inputPath).name;
      }
      const cleanName = baseName.replace(/\s+/g, "_"); // Remove espaços
      const outputDir = path.join(outputBasePath, cleanName);
      await fs.ensureDir(outputDir);

      const results: Array<{
        resolution: string;
        path: string;
        md5: string;
        originalName: string;
      }> = [];

      // Processa cada resolução
      for (const resolution of resolutions) {
        const resolutionDir = path.join(outputDir, resolution.toString());
        await fs.ensureDir(resolutionDir);

        // Redimensiona a imagem mantendo o aspect ratio
        const resizedBuffer = await sharp(imageBuffer)
          .resize(resolution, null, {
            withoutEnlargement: true,
            fit: "inside",
          })
          .jpeg({ quality: 90 })
          .toBuffer();

        // Gera hash MD5 do arquivo processado
        const md5 = crypto
          .createHash("md5")
          .update(resizedBuffer)
          .digest("hex");

        // Salva o arquivo (path físico)
        const physicalPath = path.join(resolutionDir, `${md5}.jpg`);
        await fs.writeFile(physicalPath, resizedBuffer);

        // Gera o path no formato correto para retorno
        const returnPath = `/output/${cleanName}/${resolution}/${md5}.jpg`;

        results.push({
          resolution: resolution.toString(),
          path: returnPath, // Retorna path no formato Unix
          md5,
          originalName: originalName || path.parse(inputPath).name, // Retorna o nome original completo
        });
      }

      return results;
    } catch (error) {
      throw new Error(
        `Image processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Valida se o arquivo é uma imagem suportada
   */
  public static async validateImage(filePath: string): Promise<boolean> {
    try {
      const ext = path.extname(filePath).toLowerCase().slice(1);
      if (!config.supportedFormats.includes(ext)) {
        return false;
      }

      const metadata = await sharp(filePath).metadata();
      return !!(metadata.width && metadata.height);
    } catch {
      return false;
    }
  }

  /**
   * Valida se uma string é uma URL válida de imagem
   */
  public static isValidImageUrl(urlString: string): boolean {
    return UrlDownloader.isValidImageUrl(urlString);
  }

  /**
   * Valida se uma string é um caminho de arquivo local válido
   */
  public static isValidLocalPath(pathString: string): boolean {
    try {
      // Primeiro verifica se não é uma URL (verificação simples)
      if (
        pathString.startsWith("http://") ||
        pathString.startsWith("https://")
      ) {
        return false;
      }

      // Verifica se é um caminho válido
      const parsedPath = path.parse(pathString);
      if (!parsedPath.name || !parsedPath.ext) {
        return false;
      }

      // Verifica se a extensão é suportada
      const extension = parsedPath.ext.toLowerCase().substring(1);

      return config.supportedFormats.includes(extension);
    } catch {
      return false;
    }
  }

  /**
   * Valida se uma string é uma URL ou caminho local válido
   */
  public static isValidImageSource(source: string): boolean {
    return this.isValidImageUrl(source) || this.isValidLocalPath(source);
  }

  /**
   * Gera um preço aleatório entre 5 e 50
   */
  public static generateRandomPrice(): number {
    return Math.round((Math.random() * 45 + 5) * 10) / 10; // 5.0 a 50.0
  }
}
