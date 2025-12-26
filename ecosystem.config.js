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
        ADMIN_API_KEY: 'Usman@567784',
        ADMIN_EMAILS: 'wanum01234@gmail.com'
      }
    },
    {
      name: 'arbix-deposit-worker',
      script: './backend/src/workers/moralisDepositWorker.js',
      cwd: '/var/www/arbix',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        MORALIS_API_KEY: '',
        MORALIS_STREAM_ID: '',
        MORALIS_STREAM_SECRET: '',
        BSC_RPC_URL: '',
        DEPOSIT_CONFIRMATIONS: 12,
        MIN_DEPOSIT_USDT: 9,
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
        ADMIN_API_KEY: 'Usman@567784'
      }
    }
  ]
};
