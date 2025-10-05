const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Fallback a Gmail si no se configuró SMTP_*
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASS;

  if (host && user && pass) {
    const secure = port === 465; // true for 465, false for other ports
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  }

  if (gmailUser && gmailPass) {
    // Requiere App Password en cuentas Gmail (ya proporcionado en .env)
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
  }

  throw new Error('Email configuration missing: set SMTP_* or EMAIL_USER/EMAIL_PASS');
}

async function sendPasswordResetEmail({ to, link, tipo, displayName }) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@ecopoints.local';

  const subject = 'Restablecimiento de contraseña - EcoPoints';
  const plain = `Hola ${displayName || ''}\n\n` +
    `Recibimos una solicitud para restablecer tu contraseña de ${tipo}.\n` +
    `Usa el siguiente enlace para continuar (válido por 1 hora):\n\n${link}\n\n` +
    `Si no solicitaste este cambio, puedes ignorar este correo.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Restablecimiento de contraseña</h2>
      <p>Hola ${displayName || ''},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña de <strong>${tipo}</strong>.</p>
      <p>Usa el siguiente botón para continuar (válido por 1 hora):</p>
      <p>
        <a href="${link}" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
          Restablecer contraseña
        </a>
      </p>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p><a href="${link}">${link}</a></p>
      <hr/>
      <p style="color:#666;font-size:12px">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    </div>
  `;

  await transporter.sendMail({ from, to, subject, text: plain, html });
}

module.exports = { sendPasswordResetEmail };
