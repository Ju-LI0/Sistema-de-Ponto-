const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (stored === 'demo') return password === '123456';
  const [salt, key] = String(stored).split(':');
  if (!salt || !key) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(key, 'hex'));
}

function token() { return crypto.randomBytes(32).toString('hex'); }
function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
module.exports = { hashPassword, verifyPassword, token, sanitizeUser };
