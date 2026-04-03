# auto-sweep-worker

Standalone service that receives a wallet + HD index and sweeps BEP20 USDT to a main wallet.

## Setup

```bash
npm install
cp .env.example .env
# fill env values
npm start
```

Optional (logs): set `AUTO_SWEEP_LOG_URL` and `AUTO_SWEEP_LOG_KEY` to push step logs into the main backend.

## API

- POST `/sweep`

Body:

```json
{
  "wallet": "0x...",
  "index": 123
}
```

- GET `/health`

## Logging

When `AUTO_SWEEP_LOG_URL` and `AUTO_SWEEP_LOG_KEY` are configured, the worker will emit step-by-step logs using `POST {AUTO_SWEEP_LOG_URL}/api/auto-sweep/logs`.
