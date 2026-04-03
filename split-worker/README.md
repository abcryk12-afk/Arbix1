# split-worker

Standalone service that receives a swept USDT amount + txHash and distributes ONLY that provided amount from the main wallet into multiple wallets based on SPLIT_RULES.

## Setup

```bash
npm install
cp .env.example .env
# fill env values
npm start
```

## API

- POST `/split`

Body:

```json
{
  "amount": "12.5",
  "txHash": "0x..."
}
```

- GET `/health`

## PM2

Example:

```bash
pm2 start src/index.js --name split-worker
pm2 logs split-worker --lines 200
```
