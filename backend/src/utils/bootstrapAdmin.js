const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');
const { ensureWalletForUser } = require('../services/walletService');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function main() {
  const email = getArg('--email');
  const password = getArg('--password');
  const name = getArg('--name') || 'Admin';

  if (!email || !password) {
    console.error('Usage: node src/utils/bootstrapAdmin.js --email <email> --password <password> [--name <name>]');
    process.exit(1);
  }

  if (!process.env.DB_NAME || !process.env.DB_USER) {
    console.error('Missing DB env vars. Ensure backend/.env has DB_NAME, DB_USER, DB_PASSWORD, DB_HOST.');
    process.exit(1);
  }

  await sequelize.authenticate();
  await sequelize.sync();

  let user = await User.findOne({ where: { email } });

  if (!user) {
    user = await User.create({
      name,
      email,
      password,
      phone: null,
      referredBy: null,
      emailVerified: true,
      accountStatus: 'active',
      emailVerificationToken: null,
      emailVerificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user.name = user.name || name;
    user.password = hashed;
    user.emailVerified = true;
    user.accountStatus = 'active';
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
  }

  await ensureWalletForUser(user);

  console.log(`Admin account ready: ${user.email}`);
  console.log('Important: ensure this email is present in ADMIN_EMAILS on the backend (.env).');

  await sequelize.close();
}

main().catch(async (err) => {
  console.error('Bootstrap admin failed:', err);
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
