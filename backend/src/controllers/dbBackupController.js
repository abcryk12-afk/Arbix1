const { spawn } = require('child_process');

function requireBackupPassword(req, res) {
  const expected = process.env.ADMIN_DB_BACKUP_PASSWORD;
  if (!expected) {
    res.status(500).json({ success: false, message: 'DB backup password is not configured' });
    return false;
  }

  const provided = req.headers['x-backup-password'];
  if (!provided || String(provided) !== String(expected)) {
    res.status(401).json({ success: false, message: 'Invalid backup password' });
    return false;
  }

  return true;
}

function buildMysqlEnv() {
  const env = { ...process.env };
  if (process.env.DB_PASSWORD) {
    env.MYSQL_PWD = String(process.env.DB_PASSWORD);
  }
  return env;
}

function getDbConfig() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT ? String(process.env.DB_PORT) : '3306';
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;

  if (!user || !database) {
    return null;
  }

  return { host, port, user, database };
}

exports.exportDatabase = async (req, res) => {
  try {
    if (!requireBackupPassword(req, res)) return;

    const cfg = getDbConfig();
    if (!cfg) {
      return res.status(500).json({ success: false, message: 'Database env vars are not configured' });
    }

    const now = new Date();
    const safeTs = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `${cfg.database}-${safeTs}.sql`;

    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const args = [
      '-h',
      cfg.host,
      '-P',
      cfg.port,
      '-u',
      cfg.user,
      '--single-transaction',
      '--quick',
      '--routines',
      '--events',
      '--triggers',
      cfg.database,
    ];

    const child = spawn('mysqldump', args, {
      env: buildMysqlEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.pipe(res);

    let stderr = '';
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', (err) => {
      console.error('mysqldump spawn error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to start mysqldump' });
      } else {
        res.end();
      }
    });

    child.on('close', (code) => {
      if (code === 0) return;
      console.error('mysqldump failed:', { code, stderr });
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Database export failed' });
      }
    });
  } catch (error) {
    console.error('DB export error:', error);
    return res.status(500).json({ success: false, message: 'Database export failed' });
  }
};

exports.importDatabase = async (req, res) => {
  try {
    if (!requireBackupPassword(req, res)) return;

    const cfg = getDbConfig();
    if (!cfg) {
      return res.status(500).json({ success: false, message: 'Database env vars are not configured' });
    }

    const contentLength = req.headers['content-length'] ? Number(req.headers['content-length']) : null;
    const maxBytes = 50 * 1024 * 1024;
    if (contentLength != null && Number.isFinite(contentLength) && contentLength > maxBytes) {
      return res.status(413).json({ success: false, message: 'SQL file is too large' });
    }

    const args = ['-h', cfg.host, '-P', cfg.port, '-u', cfg.user, cfg.database];

    const child = spawn('mysql', args, {
      env: buildMysqlEnv(),
      stdio: ['pipe', 'ignore', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', (err) => {
      console.error('mysql spawn error:', err);
      return res.status(500).json({ success: false, message: 'Failed to start mysql import' });
    });

    let received = 0;
    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        try {
          child.kill('SIGKILL');
        } catch {}
        try {
          req.destroy();
        } catch {}
      }
    });

    req.pipe(child.stdin);

    child.on('close', (code) => {
      if (code === 0) {
        return res.status(200).json({ success: true, message: 'Database import completed' });
      }
      console.error('mysql import failed:', { code, stderr });
      return res.status(500).json({ success: false, message: 'Database import failed', error: stderr ? stderr.slice(0, 500) : undefined });
    });
  } catch (error) {
    console.error('DB import error:', error);
    return res.status(500).json({ success: false, message: 'Database import failed' });
  }
};
