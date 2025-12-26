const https = require('https');

function httpGetJson(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);

    const req = https.request(
      {
        method: 'GET',
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
            err.code = 'MORALIS_EVM_HTTP_ERROR';
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

    req.end();
  });
}

async function getWalletErc20Transfers({
  address,
  apiKey,
  chain = 'bsc',
  fromBlock,
  toBlock,
  cursor,
  limit = 100,
  contractAddresses,
}) {
  const a = String(address || '').trim();
  if (!a) {
    const err = new Error('Address is required');
    err.code = 'ADDRESS_REQUIRED';
    throw err;
  }

  const key = String(apiKey || '').trim();
  if (!key) {
    const err = new Error('MORALIS_API_KEY is not configured');
    err.code = 'MORALIS_API_KEY_MISSING';
    throw err;
  }

  const u = new URL(`https://deep-index.moralis.io/api/v2.2/${encodeURIComponent(a)}/erc20/transfers`);
  u.searchParams.set('chain', String(chain));

  if (fromBlock != null && Number.isFinite(Number(fromBlock))) {
    u.searchParams.set('from_block', String(Math.floor(Number(fromBlock))));
  }

  if (toBlock != null && Number.isFinite(Number(toBlock))) {
    u.searchParams.set('to_block', String(Math.floor(Number(toBlock))));
  }

  if (cursor) {
    u.searchParams.set('cursor', String(cursor));
  }

  if (limit != null && Number.isFinite(Number(limit))) {
    u.searchParams.set('limit', String(Math.min(Math.max(1, Math.floor(Number(limit))), 100)));
  }

  const list = Array.isArray(contractAddresses) ? contractAddresses : contractAddresses ? [contractAddresses] : [];
  for (const ca of list) {
    const x = String(ca || '').trim();
    if (x) u.searchParams.append('contract_addresses[]', x);
  }

  const result = await httpGetJson(u.toString(), {
    accept: 'application/json',
    'X-API-Key': key,
  });

  return result.data || {};
}

module.exports = {
  getWalletErc20Transfers,
};
