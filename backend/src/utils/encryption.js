const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM

function getKey() {
  const keyRaw = process.env.WALLET_ENC_KEY;
  const key = String(keyRaw || '').trim();
  if (!key || key.length < 32) {
    const err = new Error('WALLET_ENC_KEY must be set and at least 32 characters long');
    err.code = 'WALLET_ENC_KEY_INVALID';
    throw err;
  }
  return Buffer.from(key.slice(0, 32));
}

function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(payload) {
  const key = getKey();
  const [ivHex, tagHex, dataHex] = (payload || '').split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted payload format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = {
  encrypt,
  decrypt,
};
