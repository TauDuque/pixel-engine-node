import multer from "multer";
import path from "path";
import fs from "fs-extra";

// Configuração do multer para upload de arquivos (usa buffer em vez de arquivo)
const storage = multer.memoryStorage();

// Filtro para validar tipos de arquivo
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      )
    );
  }
};

// Configuração do multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware para upload de arquivo único - aceita qualquer campo
export const uploadSingle = upload.any();
