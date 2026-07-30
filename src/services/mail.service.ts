import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function obtenerTransporter() {
  if (!env.smtp.host) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    });
  }

  return transporter;
}

export async function enviarCorreoRecuperacion(
  correo: string,
  nombre: string,
  enlace: string
): Promise<void> {
  const cliente = obtenerTransporter();

  if (!cliente) {
    console.warn(
      `SMTP no configurado: no se pudo enviar el correo de recuperación a ${correo}. Enlace: ${enlace}`
    );
    return;
  }

  await cliente.sendMail({
    from: env.smtp.from,
    to: correo,
    subject: "Recupera tu contraseña - Catamayo Memora",
    html: `
      <p>Hola ${nombre},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en Catamayo Memora.</p>
      <p><a href="${enlace}">Haz clic aquí para crear una nueva contraseña</a></p>
      <p>Este enlace expira en 1 hora. Si tú no solicitaste esto, puedes ignorar este correo.</p>
    `,
  });
}

export async function enviarCorreoNotificacion(
  correo: string,
  nombre: string,
  mensaje: string,
  enlace: string
): Promise<void> {
  const cliente = obtenerTransporter();

  if (!cliente) {
    console.warn(`SMTP no configurado: no se pudo enviar la notificación a ${correo}`);
    return;
  }

  await cliente.sendMail({
    from: env.smtp.from,
    to: correo,
    subject: "Nueva notificación - Catamayo Memora",
    html: `
      <p>Hola ${nombre},</p>
      <p>${mensaje}</p>
      <p><a href="${enlace}">Ver en Catamayo Memora</a></p>
    `,
  });
}
