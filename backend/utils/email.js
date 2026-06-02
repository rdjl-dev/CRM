/**
 * TicketCRM — Utilidad de email (Nodemailer + Gmail)
 * Desarrollado por: Raúl de Jesús Larios
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BRAND = `
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8">
    TicketCRM · Desarrollado por <strong>Raúl de Jesús Larios</strong>
  </div>`;

const emailLayout = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;padding:36px;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(0,0,0,.06)">
    <div style="margin-bottom:28px">
      <div style="display:inline-flex;align-items:center;gap:8px;background:#F0F4FF;padding:8px 16px;border-radius:10px">
        <span style="font-size:18px">🎫</span>
        <span style="font-size:14px;font-weight:700;color:#0F172A">TicketCRM</span>
      </div>
    </div>
    ${content}
    ${BRAND}
  </div>
</body>
</html>`;

const sendPasswordReset = async (to, name, resetUrl) => {
  const html = emailLayout(`
    <h2 style="font-size:20px;font-weight:700;color:#0F172A;margin:0 0 8px">Restablece tu contraseña</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px">
      Hola <strong>${name}</strong>, hemos recibido una solicitud para restablecer la contraseña de tu cuenta en TicketCRM.
      <br><br>
      Haz clic en el botón de abajo. El enlace es válido durante <strong>1 hora</strong>.
    </p>
    <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;background:#1D6ADE;color:#fff;text-decoration:none;border-radius:9px;font-weight:600;font-size:14px">
      Restablecer contraseña
    </a>
    <p style="color:#94A3B8;font-size:12px;margin-top:24px">
      Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no cambiará.
    </p>
    <div style="background:#F8FAFC;border-radius:8px;padding:12px;margin-top:20px;word-break:break-all">
      <span style="font-size:11px;color:#64748B">O copia este enlace: </span>
      <a href="${resetUrl}" style="font-size:11px;color:#1D6ADE">${resetUrl}</a>
    </div>`);

  return transporter.sendMail({
    from: `"TicketCRM" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Restablecer contraseña — TicketCRM',
    html,
  });
};

const sendWelcome = async (to, name) => {
  const html = emailLayout(`
    <h2 style="font-size:20px;font-weight:700;color:#0F172A;margin:0 0 8px">¡Bienvenido a TicketCRM!</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px">
      Hola <strong>${name}</strong>, tu cuenta ha sido creada correctamente.
      <br><br>
      Ya puedes acceder al panel y empezar a gestionar tus tickets.
    </p>
    <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;padding:13px 28px;background:#1D6ADE;color:#fff;text-decoration:none;border-radius:9px;font-weight:600;font-size:14px">
      Acceder al panel
    </a>`);

  return transporter.sendMail({
    from: `"TicketCRM" <${process.env.SMTP_USER}>`,
    to,
    subject: '¡Bienvenido a TicketCRM!',
    html,
  });
};

module.exports = { sendPasswordReset, sendWelcome };
