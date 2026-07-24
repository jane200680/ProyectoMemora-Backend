import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

const s3 = new S3Client({ region: env.aws.region });

export async function subirArchivoS3(
  archivo: Express.Multer.File,
  carpeta: string
): Promise<string> {
  const extension = archivo.originalname.split(".").pop();
  const clave = `${carpeta}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.aws.bucket,
      Key: clave,
      Body: archivo.buffer,
      ContentType: archivo.mimetype,
    })
  );

  return `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${clave}`;
}
