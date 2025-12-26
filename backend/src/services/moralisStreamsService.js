const https = require('https');

function httpRequestJson({ method, url, headers, body }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);

    const req = https.request(
      {
        method,
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        headers,
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {}

          const status = Number(res.statusCode || 0);
          if (status >= 400) {
            const err = new Error(parsed?.message || parsed?.error || raw || `HTTP ${status}`);
            err.code = 'MORALIS_STREAMS_HTTP_ERROR';
            err.status = status;
            err.response = parsed;
            return reject(err);
          }

          resolve({ status, data: parsed });
        });
      },
    );

    req.on('error', (e) => {
      const err = new Error(e?.message || 'Request failed');
      err.code = e?.code || 'REQUEST_FAILED';
      reject(err);
    });

    if (body != null) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function addAddressesToStream({ streamId, addresses, apiKey }) {
  const id = String(streamId || '').trim();
  if (!id) {
    const err = new Error('MORALIS_STREAM_ID is not configured');
    err.code = 'MORALIS_STREAM_ID_MISSING';
    throw err;
  }

  const key = String(apiKey || '').trim();
  if (!key) {
    const err = new Error('MORALIS_API_KEY is not configured');
    err.code = 'MORALIS_API_KEY_MISSING';
    throw err;
  }

  const list = Array.isArray(addresses) ? addresses : [addresses];
  const normalized = list
    .map((a) => String(a || '').trim())
    .filter(Boolean);

  if (!normalized.length) {
    return { ok: true, added: 0 };
  }

  const url = `https://api.moralis-streams.com/streams/evm/${encodeURIComponent(id)}/address`;
  const body = { address: normalized };

  const result = await httpRequestJson({
    method: 'POST',
    url,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-api-key': key,
    },
    body,
  });

  return { ok: true, response: result.data || null };
}

module.exports = {
  addAddressesToStream,
};
