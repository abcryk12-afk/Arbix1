module.exports = {
  apps: [
    {
      name: 'arbix-backend',
      script: './backend/server.js',
      cwd: '/var/www/arbix',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        ADMIN_API_KEY: 'CHANGE_ME_STRONG_KEY',
        ADMIN_EMAILS: 'admin@example.com'
      }
    },
    {
      name: 'arbix-deposit-worker',
      script: './backend/src/workers/quicknodeDepositWorker.js',
      cwd: '/var/www/arbix',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        BSC_RPC_URL: '',
        DEPOSIT_CONFIRMATIONS: 12,
        MIN_DEPOSIT_USDT: 9,
        QUICKNODE_MAX_BLOCKS_PER_SCAN: 2000,
        QUICKNODE_LOOKBACK_BLOCKS: 20000,
      }
    },
    {
      name: 'arbix-auto-withdraw-worker',
      script: './backend/src/workers/autoWithdrawWorker.js',
      cwd: '/var/www/arbix',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        BSC_RPC_URL: '',
        WITHDRAWAL_HD_MNEMONIC: '',
        WITHDRAWAL_HD_DERIVATION_PATH: "m/44'/60'/0'/0/0",
        WITHDRAWAL_WALLET_ADDRESS: '',
        WITHDRAW_CONFIRMATIONS: 3,
      }
    },
    {
      name: 'arbix-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/arbix/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        BACKEND_URL: 'http://localhost:5000',
        ADMIN_API_KEY: 'CHANGE_ME_STRONG_KEY'
      }
    }
  ]
};
