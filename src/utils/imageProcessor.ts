import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import fs from "fs-extra";
import { config } from "../config/environment";

export class ImageProcessor {
  /**
   * Processa uma imagem criando variantes nas resoluções especificadas
   */
  public static async processImage(
    inputPath: string,
    outputBasePath: string,
    resolutions: number[] = config.resolutions
  ): Promise<Array<{ resolution: string; path: string; md5: string }>> {
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
      const originalName = path.parse(inputPath).name;
      const cleanName = originalName.replace(/\s+/g, "_"); // Remove espaços
      const outputDir = path.join(outputBasePath, cleanName);
      await fs.ensureDir(outputDir);

      const results: Array<{ resolution: string; path: string; md5: string }> =
        [];

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
   * Gera um preço aleatório entre 5 e 50
   */
  public static generateRandomPrice(): number {
    return Math.round((Math.random() * 45 + 5) * 10) / 10; // 5.0 a 50.0
  }
}
