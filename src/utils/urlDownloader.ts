import https from "https";
import http from "http";
import fs from "fs-extra";
import path from "path";
import { Logger } from "./logger";
import { config } from "../config/environment";

export interface DownloadResult {
  success: boolean;
  localPath?: string;
  originalUrl?: string;
  error?: string;
  filename?: string;
}

export class UrlDownloader {
  /**
   * Valida se uma string é uma URL válida
   */
  public static isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Valida se uma URL aponta para uma imagem suportada
   */
  public static isValidImageUrl(urlString: string): boolean {
    if (!this.isValidUrl(urlString)) {
      return false;
    }

    try {
      const url = new URL(urlString);
      const pathname = url.pathname.toLowerCase();

      return config.supportedFormats.some(
        (ext) =>
          pathname.endsWith(`.${ext}`) ||
          pathname.endsWith(`.${ext.toUpperCase()}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Extrai o nome do arquivo de uma URL
   */
  public static extractFilenameFromUrl(urlString: string): string {
    try {
      const url = new URL(urlString);
      const pathname = url.pathname;
      const filename = path.basename(pathname);

      // Se não conseguir extrair um nome válido, gera um baseado no timestamp
      if (!filename || filename === "/" || !filename.includes(".")) {
        const timestamp = Date.now();
        return `downloaded_image_${timestamp}.jpg`;
      }

      return filename;
    } catch {
      const timestamp = Date.now();
      return `downloaded_image_${timestamp}.jpg`;
    }
  }

  /**
   * Baixa uma imagem de uma URL e salva localmente
   */
  public static async downloadImage(
    urlString: string
  ): Promise<DownloadResult> {
    try {
      Logger.info("Starting image download from URL", { url: urlString });

      // Valida a URL
      if (!this.isValidImageUrl(urlString)) {
        return {
          success: false,
          error: "Invalid URL or unsupported image format",
          originalUrl: urlString,
        };
      }

      // Extrai o nome do arquivo
      const filename = this.extractFilenameFromUrl(urlString);

      // Cria o diretório de download se não existir
      const downloadDir = path.join(process.cwd(), "temp", "downloads");
      await fs.ensureDir(downloadDir);

      const localPath = path.join(downloadDir, filename);

      Logger.info("Download details", {
        url: urlString,
        filename,
        localPath,
        downloadDir,
      });

      // Faz o download da imagem
      await this.performDownload(urlString, localPath);

      // Verifica se o arquivo foi baixado corretamente
      const fileExists = await fs.pathExists(localPath);
      if (!fileExists) {
        return {
          success: false,
          error: "File was not downloaded successfully",
          originalUrl: urlString,
        };
      }

      // Verifica o tamanho do arquivo
      const stats = await fs.stat(localPath);
      if (stats.size === 0) {
        await fs.remove(localPath);
        return {
          success: false,
          error: "Downloaded file is empty",
          originalUrl: urlString,
        };
      }

      Logger.info("Image downloaded successfully", {
        url: urlString,
        localPath,
        fileSize: stats.size,
        filename,
      });

      return {
        success: true,
        localPath,
        originalUrl: urlString,
        filename,
      };
    } catch (error) {
      Logger.error("Error downloading image from URL", {
        url: urlString,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        originalUrl: urlString,
      };
    }
  }

  /**
   * Executa o download HTTP/HTTPS
   */
  private static async performDownload(
    urlString: string,
    localPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlString);
      const protocol = url.protocol === "https:" ? https : http;

      const request = protocol.get(
        urlString,
        {
          timeout: 30000, // 30 segundos de timeout
          headers: {
            "User-Agent": "Pixel-Engine-API/1.0.0",
          },
        },
        (response) => {
          // Verifica se a resposta é válida
          if (response.statusCode && response.statusCode >= 400) {
            reject(
              new Error(
                `HTTP ${response.statusCode}: ${response.statusMessage}`
              )
            );
            return;
          }

          // Verifica o content-type
          const contentType = response.headers["content-type"];
          if (contentType && !contentType.startsWith("image/")) {
            reject(new Error(`Invalid content type: ${contentType}`));
            return;
          }

          // Cria o stream de escrita
          const fileStream = fs.createWriteStream(localPath);

          // Pipe do response para o arquivo
          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            resolve();
          });

          fileStream.on("error", (error) => {
            fs.remove(localPath).catch(() => {}); // Remove arquivo parcial
            reject(error);
          });
        }
      );

      request.on("error", (error) => {
        reject(error);
      });

      request.on("timeout", () => {
        request.destroy();
        reject(new Error("Download timeout"));
      });
    });
  }

  /**
   * Limpa arquivos temporários de download
   */
  public static async cleanupTempFiles(): Promise<void> {
    try {
      const downloadDir = path.join(process.cwd(), "temp", "downloads");
      if (await fs.pathExists(downloadDir)) {
        await fs.remove(downloadDir);
        Logger.info("Cleaned up temporary download files");
      }
    } catch (error) {
      Logger.error("Error cleaning up temporary files", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
