const { SiteSetting } = require('../models');
const { sendEmail } = require('../config/email');

const SETTING_KEY = 'admin_notification_emails';

const normalizeEmail = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return ok ? v : null;
};

const normalizeEmailList = (input) => {
  const arr = Array.isArray(input) ? input : [];
  const out = [];
  const seen = new Set();
  for (const e of arr) {
    const n = normalizeEmail(e);
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
};

const getStoredEmailList = async () => {
  const row = await SiteSetting.findOne({ where: { key: SETTING_KEY } });
  if (!row || !row.value) {
    const env = process.env.ADMIN_NOTIFICATION_EMAILS || process.env.ADMIN_EMAILS || '';
    return normalizeEmailList(String(env).split(',').map((s) => s.trim()));
  }

  try {
    const parsed = JSON.parse(String(row.value));
    return normalizeEmailList(parsed);
  } catch {
    return normalizeEmailList(String(row.value).split(',').map((s) => s.trim()));
  }
};

const setStoredEmailList = async (emails) => {
  const normalized = normalizeEmailList(emails);
  const existing = await SiteSetting.findOne({ where: { key: SETTING_KEY } });
  const payload = JSON.stringify(normalized);

  if (existing) {
    existing.value = payload;
    await existing.save();
  } else {
    await SiteSetting.create({ key: SETTING_KEY, value: payload });
  }

  return normalized;
};

const formatDateTime = (d) => {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d || '');
  }
};

const toMoney = (n) => {
  const v = Number(n || 0);
  return Number.isFinite(v) ? `$${v.toFixed(2)}` : '$0.00';
};

const buildHtml = ({ subject, headline, user, details }) => {
  const userId = user?.id != null ? String(user.id) : '';
  const name = user?.name ? String(user.name) : '';
  const email = user?.email ? String(user.email) : '';
  const phone = user?.phone ? String(user.phone) : '';

  const rows = [
    { k: 'User ID', v: userId },
    { k: 'User Name', v: name },
    { k: 'User Email', v: email },
    { k: 'User Phone', v: phone },
    ...(Array.isArray(details) ? details : []),
  ].filter((r) => r.v != null && String(r.v).trim() !== '');

  const rowsHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 600; width: 180px;">${r.k}</td>
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">${String(r.v)}</td>
        </tr>`,
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 18px; background-color: #f1f5f9;">
      <div style="background-color: #0f172a; padding: 18px; border-radius: 10px 10px 0 0; text-align: left;">
        <div style="color: #ffffff; font-size: 18px; font-weight: 700;">Arbix Admin Notification</div>
        <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">${subject}</div>
      </div>
      <div style="background-color: #ffffff; padding: 18px; border-radius: 0 0 10px 10px;">
        <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">${headline}</div>
        <table style="border-collapse: collapse; width: 100%; font-size: 13px;">
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div style="margin-top: 14px; color: #64748b; font-size: 12px;">
          This is an automated notification.
        </div>
      </div>
    </div>
  `;
};

const sendToAdmins = async ({ subject, text, html }) => {
  const toList = await getStoredEmailList();
  if (!toList.length) return { ok: false, reason: 'NO_RECIPIENTS' };

  await sendEmail({
    to: toList.join(', '),
    subject,
    text,
    html,
  });

  return { ok: true, sent: toList.length };
};

const notifyNewUserRegistration = async ({ user }) => {
  const subject = 'New User Registration';
  const headline = 'A new user has registered.';

  const html = buildHtml({
    subject,
    headline,
    user,
    details: [{ k: 'Request Type', v: 'Registration' }, { k: 'Status', v: 'Pending verification (OTP)' }, { k: 'Time', v: formatDateTime(new Date()) }],
  });

  const text = `New user registration\nUser ID: ${user?.id || ''}\nName: ${user?.name || ''}\nEmail: ${user?.email || ''}`;

  return sendToAdmins({ subject, text, html });
};

const notifyDepositRequest = async ({ user, request }) => {
  const subject = 'New Deposit Request Submitted';
  const headline = 'A user submitted a new deposit request.';

  const html = buildHtml({
    subject,
    headline,
    user,
    details: [
      { k: 'Request ID', v: request?.id != null ? String(request.id) : '' },
      { k: 'Request Type', v: 'Deposit' },
      { k: 'Deposit Amount', v: toMoney(request?.amount) },
      { k: 'Wallet Address', v: request?.address || '' },
      { k: 'Tx Hash', v: request?.txHash || request?.tx_hash || '' },
      { k: 'User Note', v: request?.userNote || request?.user_note || '' },
      { k: 'Status', v: request?.status || 'pending' },
      { k: 'Request Time', v: formatDateTime(request?.createdAt || request?.created_at || new Date()) },
    ],
  });

  const text = `New deposit request\nUser ID: ${user?.id || ''}\nEmail: ${user?.email || ''}\nAmount: ${toMoney(request?.amount)}\nStatus: ${request?.status || 'pending'}`;

  return sendToAdmins({ subject, text, html });
};

const notifyWithdrawRequest = async ({ user, request }) => {
  const subject = 'New Withdraw Request Submitted';
  const headline = 'A user submitted a new withdrawal request.';

  const html = buildHtml({
    subject,
    headline,
    user,
    details: [
      { k: 'Request ID', v: request?.id != null ? String(request.id) : '' },
      { k: 'Request Type', v: 'Withdraw' },
      { k: 'Withdraw Amount', v: toMoney(request?.amount) },
      { k: 'Withdraw Address', v: request?.address || '' },
      { k: 'User Note', v: request?.userNote || request?.user_note || '' },
      { k: 'Status', v: request?.status || 'pending' },
      { k: 'Request Time', v: formatDateTime(request?.createdAt || request?.created_at || new Date()) },
    ],
  });

  const text = `New withdrawal request\nUser ID: ${user?.id || ''}\nEmail: ${user?.email || ''}\nAmount: ${toMoney(request?.amount)}\nStatus: ${request?.status || 'pending'}`;

  return sendToAdmins({ subject, text, html });
};

module.exports = {
  normalizeEmailList,
  getStoredEmailList,
  setStoredEmailList,
  notifyNewUserRegistration,
  notifyDepositRequest,
  notifyWithdrawRequest,
};
