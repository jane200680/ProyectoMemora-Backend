import multer from "multer";
import { HttpError } from "./errorHandler.js";

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "application/pdf",
];

export const uploadArchivosMultimedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      cb(new HttpError(400, `Tipo de archivo no permitido: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
}).array("archivos", 5);
