# auto-sweep-worker

Standalone service that receives a wallet + HD index and sweeps BEP20 USDT to a main wallet.

## Setup

```bash
npm install
cp .env.example .env
# fill env values
npm start
```

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
