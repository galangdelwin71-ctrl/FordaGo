const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

async function sendEmail({ to, subject, text }) {
  const destination = String(to || '').trim();
  const body = String(text || '').trim();
  const title = String(subject || 'FordaGO Notification').trim();

  if (!destination || !body) {
    return { sent: false, skippedReason: 'Missing destination email or message' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, skippedReason: 'SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)' };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: destination,
      subject: title,
      text: body,
    });
    return { sent: true, provider: 'smtp' };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown email error' };
  }
}

module.exports = { sendEmail };
