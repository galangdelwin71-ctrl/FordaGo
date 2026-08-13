function normalizePhoneNumber(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('63') && digits.length >= 12) {
    return `+${digits}`;
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `+63${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    return `+63${digits}`;
  }

  return value.startsWith('+') ? value : `+${digits}`;
}

async function sendViaSemaphore(to, message) {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  const senderName = process.env.SEMAPHORE_SENDER || 'FordaGO';

  if (!apiKey) {
    return { sent: false, skippedReason: 'Missing SEMAPHORE_API_KEY' };
  }

  const payload = new URLSearchParams({
    apikey: apiKey,
    number: to,
    message,
    sendername: senderName,
  });

  const response = await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Semaphore request failed: ${response.status} ${body}`);
  }

  return { sent: true, provider: 'semaphore' };
}

async function sendViaTwilio(to, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    return { sent: false, skippedReason: 'Missing Twilio credentials' };
  }

  const payload = new URLSearchParams({
    To: to,
    From: from,
    Body: message,
  });

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Twilio request failed: ${response.status} ${body}`);
  }

  return { sent: true, provider: 'twilio' };
}

async function sendSms({ to, message }) {
  const normalizedTo = normalizePhoneNumber(to);
  const text = String(message || '').trim();

  if (!normalizedTo || !text) {
    return { sent: false, skippedReason: 'Missing destination number or message' };
  }

  const provider = String(process.env.SMS_PROVIDER || '').trim().toLowerCase();
  if (!provider) {
    return { sent: false, skippedReason: 'SMS_PROVIDER not configured' };
  }

  try {
    if (provider === 'semaphore') {
      return await sendViaSemaphore(normalizedTo, text);
    }

    if (provider === 'twilio') {
      return await sendViaTwilio(normalizedTo, text);
    }

    return { sent: false, skippedReason: `Unsupported SMS provider: ${provider}` };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown SMS error' };
  }
}

module.exports = {
  sendSms,
  normalizePhoneNumber,
};
