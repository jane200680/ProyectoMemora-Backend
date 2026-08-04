import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_LOGO = path.resolve(__dirname, "../assets/logo.png");
const CID_LOGO = "logo-catamayo-memora";

function obtenerAdjuntoLogo() {
  if (!fs.existsSync(RUTA_LOGO)) return [];

  return [
    {
      filename: "logo.png",
      path: RUTA_LOGO,
      cid: CID_LOGO,
    },
  ];
}

function construirPlantilla(opciones: {
  titulo: string;
  preheader: string;
  saludo: string;
  cuerpoHtml: string;
  cta?: { texto: string; enlace: string };
  notaPie?: string;
}) {
  const { titulo, preheader, saludo, cuerpoHtml, cta, notaPie } = opciones;

  const botonHtml = cta
    ? `
      <tr>
        <td align="center" style="padding: 8px 0 28px;">
          <a href="${cta.enlace}"
             style="background-color:#1e7a4c;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;display:inline-block;">
            ${cta.texto}
          </a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${titulo}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06);font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td align="center" style="background-color:#0f3d2e;padding:28px 24px;">
                <img src="cid:${CID_LOGO}" alt="Catamayo Memora" width="72" style="display:block;margin:0 auto 8px;border-radius:8px;" />
                <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.3px;">Catamayo Memora</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;">${saludo}</p>
                <div style="color:#3a3a3a;font-size:15px;line-height:1.6;">
                  ${cuerpoHtml}
                </div>
              </td>
            </tr>
            ${botonHtml}
            <tr>
              <td style="padding:0 32px 28px;">
                <p style="margin:0;color:#8a8a8a;font-size:12.5px;line-height:1.5;">
                  ${notaPie ?? "Si tú no realizaste esta acción, puedes ignorar este correo con tranquilidad."}
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f0f2f1;padding:16px 32px;text-align:center;">
                <p style="margin:0;color:#9a9a9a;font-size:12px;">
                  © ${new Date().getFullYear()} Catamayo Memora · Preservando la memoria cultural de Catamayo
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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

  const html = construirPlantilla({
    titulo: "Recupera tu contraseña",
    preheader: "Restablece tu contraseña de Catamayo Memora de forma segura.",
    saludo: `Hola, ${nombre}.`,
    cuerpoHtml: `
      <p style="margin:0 0 12px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Catamayo Memora</strong>.</p>
      <p style="margin:0;">Haz clic en el siguiente botón para crear una nueva contraseña. Por tu seguridad, este enlace es válido durante <strong>1 hora</strong>.</p>
    `,
    cta: { texto: "Crear nueva contraseña", enlace },
    notaPie:
      "Si tú no solicitaste este cambio, puedes ignorar este correo: tu contraseña actual seguirá funcionando con normalidad.",
  });

  await cliente.sendMail({
    from: `"Catamayo Memora" <${env.smtp.from}>`,
    to: correo,
    subject: "Recupera tu contraseña – Catamayo Memora",
    html,
    attachments: obtenerAdjuntoLogo(),
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

  const html = construirPlantilla({
    titulo: "Nueva notificación",
    preheader: mensaje,
    saludo: `Hola, ${nombre}.`,
    cuerpoHtml: `<p style="margin:0;">${mensaje}</p>`,
    cta: { texto: "Ver en Catamayo Memora", enlace },
    notaPie: "Recibiste este correo porque tienes activadas las notificaciones de tu cuenta en Catamayo Memora.",
  });

  await cliente.sendMail({
    from: `"Catamayo Memora" <${env.smtp.from}>`,
    to: correo,
    subject: "Nueva notificación – Catamayo Memora",
    html,
    attachments: obtenerAdjuntoLogo(),
  });
}
