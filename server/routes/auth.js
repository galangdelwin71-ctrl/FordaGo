const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { sendSms, normalizePhoneNumber } = require('../services/sms');
const { sendEmail } = require('../services/email');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-jwt-secret-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const DUMMY_PASSWORD_HASH = '$2a$10$8K1p/a0B0f8QfCMgfHdCvuQ6fHhSdz8sRP/6IDdnh3oX1N1pAVcc6';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

// Forgot-password tuning
const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const RESET_CODE_RESEND_MS = 60 * 1000;
const RESET_MAX_SENDS_PER_HOUR = 5;
const RESET_MAX_VERIFY_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRES_IN = '10m';
const resetSendLog = new Map();

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 20);
}

function normalizeName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isValidPhone(value) {
  return /^\d{11}$/.test(value);
}

function isValidEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function parseAccountIdentifier(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return { type: 'unknown', email: '', phone: '', value: '' };
  }
  if (raw.includes('@')) {
    const email = normalizeEmail(raw);
    return { type: 'email', email, phone: '', value: email };
  }
  const phone = normalizePhone(raw);
  return { type: 'phone', email: '', phone, value: phone };
}

async function findUserByIdentifier(identifierInput) {
  const identifier = parseAccountIdentifier(identifierInput);
  if (identifier.type === 'email') {
    if (!isValidEmail(identifier.email)) return null;
    const [rows] = await pool.query(
      'SELECT id, username, first_name, last_name, email, phone FROM users WHERE email = ? LIMIT 1',
      [identifier.email]
    );
    return rows[0] || null;
  }

  if (identifier.type === 'phone') {
    if (!isValidPhone(identifier.phone)) return null;
    const [rows] = await pool.query(
      'SELECT id, username, first_name, last_name, email, phone FROM users WHERE phone = ? LIMIT 1',
      [identifier.phone]
    );
    return rows[0] || null;
  }

  return null;
}

async function buildUniqueUsername(firstName, lastName) {
  const base = normalizeName(`${firstName} ${lastName}`) || `member-${Date.now()}`;
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base} ${suffix + 1}`;
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [candidate]);
    if (!rows.length) return candidate;
  }
  return `${base} ${Date.now()}`;
}


function isStrongPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasLower && hasUpper && hasNumber && hasSpecial;
}

function getAttemptKey(req, email) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown-ip';
  return `${ip}:${email}`;
}

function getAttemptState(key) {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current) return { count: 0, lockUntil: 0 };
  if (current.lockUntil && current.lockUntil <= now) {
    loginAttempts.delete(key);
    return { count: 0, lockUntil: 0 };
  }
  return current;
}

function registerFailedAttempt(key) {
  const state = getAttemptState(key);
  const newCount = state.count + 1;
  const nextState = { count: newCount, lockUntil: 0 };
  if (newCount >= MAX_FAILED_ATTEMPTS) {
    nextState.lockUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(key, nextState);
}

function clearAttempts(key) {
  if (loginAttempts.has(key)) loginAttempts.delete(key);
}

// Login route
router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  if (password.length > 128) {
    return res.status(400).json({ message: 'Invalid email or password.' });
  }

  const attemptKey = getAttemptKey(req, email);
  const attemptState = getAttemptState(attemptKey);
  if (attemptState.lockUntil && attemptState.lockUntil > Date.now()) {
    return res.status(429).json({ message: 'Too many failed attempts. Please try again later.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      registerFailedAttempt(attemptKey);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      registerFailedAttempt(attemptKey);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isStaffRole = ['admin', 'super_admin', 'employee'].includes(user.role);
    if (!isStaffRole && user.membership_status !== 'active') {
      const pendingMessage = user.membership_type === 'premium'
        ? 'Your Premium account is still pending admin payment verification. Please complete payment and wait for approval before logging in.'
        : 'Your Daily Pass account is still pending admin verification. Please wait for approval before logging in.';
      return res.status(403).json({ message: pendingMessage });
    }

    clearAttempts(attemptKey);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        profile_image: user.profile_image,
        membership_type: user.membership_type,
        membership_status: user.membership_status,
        payment_method: user.payment_method,
        membership_expiry: user.membership_expiry,
        created_at: user.created_at ? new Date(user.created_at).toISOString() : null,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public registration route
router.post('/register', async (req, res) => {
  const firstName = normalizeName(req.body?.firstName || req.body?.first_name);
  const lastName = normalizeName(req.body?.lastName || req.body?.last_name);
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const rawPhone = String(req.body?.phone || '').trim();
  const phone = normalizePhone(rawPhone);
  const gender = String(req.body?.gender || '').trim().toLowerCase();
  const membership_type = req.body?.membership_type;
  const payment_method = req.body?.payment_method;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'First name, last name, email, and password are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password must be 8+ chars with uppercase, lowercase, number, and special character.' });
  }
  if (rawPhone && !isValidPhone(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 11 digits (e.g. 09171234567).' });
  }
  if (gender && !['male', 'female', 'other'].includes(gender)) {
    return res.status(400).json({ message: 'Invalid gender selection.' });
  }

  try {
    const [userRows] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (userRows.length > 0) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const username = await buildUniqueUsername(firstName, lastName);
    const hashed = await bcrypt.hash(password, 10);
    const normalizedMembershipType = membership_type === 'daily' ? 'daily' : 'premium';
    const normalizedPaymentMethod = payment_method === 'gcash' ? 'gcash' : 'cash';
    const membershipStatus = 'pending';
    const membershipExpiry = null;

    await pool.query(
      'INSERT INTO users (username, first_name, last_name, email, password, role, phone, gender, membership_type, membership_status, payment_method, membership_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        username,
        firstName,
        lastName,
        email,
        hashed,
        'user',
        phone || null,
        gender || null,
        normalizedMembershipType,
        membershipStatus,
        normalizedPaymentMethod,
        membershipExpiry,
      ]
    );

    // Notify admin of new registration
    await pool.query(
      'INSERT INTO notifications (user_id, title, message) SELECT id, ?, ? FROM users WHERE role = "admin" LIMIT 1',
      [
        `New Member: ${firstName} ${lastName}`,
        normalizedMembershipType === 'premium'
          ? `${firstName} ${lastName} registered as Premium (${normalizedPaymentMethod}). Verify payment, then activate the account.`
          : `${firstName} ${lastName} registered as Daily Pass. Verify the account first before first login. Daily payment confirmation remains per scan.`,
      ]
    ).catch(() => {}); // ignore if admin not found

    const normalizedPhone = normalizePhoneNumber(phone);
    const smsMessage = normalizedMembershipType === 'premium'
      ? `FordaGO: Hi ${firstName}, your Premium registration is pending admin verification. Please pay P500 via ${normalizedPaymentMethod === 'gcash' ? 'GCash' : 'cash at the gym counter'} and wait for approval before login.`
      : `FordaGO: Hi ${firstName}, your Daily Pass registration is pending admin verification. You can log in after approval. Daily payment remains per gym check-in.`;

    const smsResult = normalizedPhone
      ? await sendSms({ to: normalizedPhone, message: smsMessage })
      : { sent: false, skippedReason: 'No phone number provided' };

    res.json({
      message: 'Registration submitted. Please wait for admin verification before login.',
      smsSent: Boolean(smsResult.sent),
      smsProvider: smsResult.provider || null,
      smsReason: smsResult.sent ? null : (smsResult.skippedReason || smsResult.error || 'SMS not sent'),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password for authenticated user
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new password are required' });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: 'New password must be 8+ chars with uppercase, lowercase, number, and special character' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Forgot password (email or SMS one-time code) ─────────────────────────

function hashResetCode(code) {
  return crypto.createHash('sha256').update(`${code}:${JWT_SECRET}`).digest('hex');
}

function generateResetCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function maskEmail(email) {
  const value = String(email || '');
  const atIndex = value.indexOf('@');
  if (atIndex <= 0) return value;
  const name = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${'*'.repeat(Math.max(name.length - visible.length, 1))}@${domain}`;
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '*'.repeat(digits.length);
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

function getResetLimitKey(req, email) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown-ip';
  return `${ip}:${email}`;
}

function checkResetSendAllowed(key) {
  const now = Date.now();
  const state = resetSendLog.get(key);
  if (!state) return { allowed: true };
  if (now - state.lastSentAt < RESET_CODE_RESEND_MS) {
    return { allowed: false, message: 'Please wait a moment before requesting another code.' };
  }
  if (now - state.windowStart < 60 * 60 * 1000 && state.count >= RESET_MAX_SENDS_PER_HOUR) {
    return { allowed: false, message: 'Too many code requests. Please try again later.' };
  }
  return { allowed: true };
}

function registerResetSend(key) {
  const now = Date.now();
  const state = resetSendLog.get(key);
  if (!state || now - state.windowStart >= 60 * 60 * 1000) {
    resetSendLog.set(key, { windowStart: now, count: 1, lastSentAt: now });
  } else {
    resetSendLog.set(key, { windowStart: state.windowStart, count: state.count + 1, lastSentAt: now });
  }
}

// Step 1: look up the account and show which delivery channels are available
router.post('/forgot-password/lookup', async (req, res) => {
  const identifier = String(req.body?.identifier || req.body?.email || req.body?.phone || '').trim();
  const parsed = parseAccountIdentifier(identifier);
  if ((parsed.type === 'email' && !isValidEmail(parsed.email)) || (parsed.type === 'phone' && !isValidPhone(parsed.phone)) || parsed.type === 'unknown') {
    return res.status(400).json({ message: 'Enter a valid email or 11-digit phone number.' });
  }

  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email or phone number.' });
    }

    const hasPhone = Boolean(user.phone && normalizePhoneNumber(user.phone));

    res.json({
      identifierType: parsed.type,
      identifierValue: parsed.value,
      emailMasked: maskEmail(user.email),
      hasPhone,
      phoneMasked: hasPhone ? maskPhone(user.phone) : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Step 2: send a one-time code to the chosen channel
router.post('/forgot-password/send', async (req, res) => {
  const identifier = String(req.body?.identifier || req.body?.email || req.body?.phone || '').trim();
  const parsed = parseAccountIdentifier(identifier);
  const channel = req.body?.channel === 'sms' ? 'sms' : (req.body?.channel === 'email' ? 'email' : '');

  if ((parsed.type === 'email' && !isValidEmail(parsed.email)) || (parsed.type === 'phone' && !isValidPhone(parsed.phone)) || parsed.type === 'unknown' || !channel) {
    return res.status(400).json({ message: 'Identifier and a valid delivery channel are required.' });
  }

  const limitKey = getResetLimitKey(req, parsed.value);
  const limitState = checkResetSendAllowed(limitKey);
  if (!limitState.allowed) {
    return res.status(429).json({ message: limitState.message });
  }

  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email or phone number.' });
    }
    const normalizedPhone = normalizePhoneNumber(user.phone);

    if (channel === 'sms' && !normalizedPhone) {
      return res.status(400).json({ message: 'No phone number on file for SMS delivery.' });
    }

    const destination = channel === 'email' ? user.email : normalizedPhone;
    const code = generateResetCode();
    const codeHash = hashResetCode(code);
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);

    await pool.query(
      'INSERT INTO password_resets (user_id, channel, destination, code_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, channel, destination, codeHash, expiresAt]
    );

    registerResetSend(limitKey);

    const message = `FordaGO: Your password reset code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this message.`;
    const deliveryResult = channel === 'email'
      ? await sendEmail({ to: destination, subject: 'FordaGO Password Reset Code', text: message })
      : await sendSms({ to: destination, message });

    const isConfigIssue = !deliveryResult.sent && (
      (deliveryResult.skippedReason || '').toLowerCase().includes('not configured') ||
      (deliveryResult.skippedReason || '').toLowerCase().includes('missing')
    );
    res.json({
      sent: Boolean(deliveryResult.sent),
      channel,
      destinationMasked: channel === 'email' ? maskEmail(destination) : maskPhone(destination),
      reason: deliveryResult.sent ? null : (deliveryResult.skippedReason || deliveryResult.error || 'Could not send code'),
      // devCode: returned for demo/testing when delivery service is not configured
      devCode: isConfigIssue ? code : undefined,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Step 3: verify the one-time code and issue a short-lived reset token
router.post('/forgot-password/verify', async (req, res) => {
  const identifier = String(req.body?.identifier || req.body?.email || req.body?.phone || '').trim();
  const parsed = parseAccountIdentifier(identifier);
  const code = String(req.body?.code || '').trim();

  if ((parsed.type === 'email' && !isValidEmail(parsed.email)) || (parsed.type === 'phone' && !isValidPhone(parsed.phone)) || parsed.type === 'unknown' || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Please enter the 6-digit code sent to you.' });
  }

  try {
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email or phone number.' });
    }
    const userId = user.id;

    const [resetRows] = await pool.query(
      `SELECT * FROM password_resets
       WHERE user_id = ? AND verified_at IS NULL AND password_changed_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (!resetRows.length) {
      return res.status(400).json({ message: 'Code expired or not requested. Please request a new code.' });
    }

    const resetRow = resetRows[0];
    if (resetRow.attempts >= RESET_MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
    }

    if (hashResetCode(code) !== resetRow.code_hash) {
      await pool.query('UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?', [resetRow.id]);
      return res.status(400).json({ message: 'Invalid code. Please try again.' });
    }

    await pool.query('UPDATE password_resets SET verified_at = NOW() WHERE id = ?', [resetRow.id]);

    const resetToken = jwt.sign(
      { sub: userId, rid: resetRow.id, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES_IN }
    );

    res.json({ resetToken });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Step 4: set the new password using the verified reset token
router.post('/forgot-password/reset', async (req, res) => {
  const resetToken = String(req.body?.resetToken || '');
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: 'Reset token and new password are required.' });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: 'Password must be 8+ chars with uppercase, lowercase, number, and special character.' });
  }

  let payload;
  try {
    payload = jwt.verify(resetToken, JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ message: 'Reset session expired. Please start again.' });
  }

  if (!payload || payload.purpose !== 'password_reset') {
    return res.status(400).json({ message: 'Invalid reset session. Please start again.' });
  }

  try {
    const [resetRows] = await pool.query(
      'SELECT * FROM password_resets WHERE id = ? AND user_id = ?',
      [payload.rid, payload.sub]
    );

    const resetRow = resetRows[0];
    if (!resetRow || !resetRow.verified_at || resetRow.password_changed_at) {
      return res.status(400).json({ message: 'Reset session is no longer valid. Please start again.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, payload.sub]);
    await pool.query('UPDATE password_resets SET password_changed_at = NOW() WHERE id = ?', [resetRow.id]);

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;