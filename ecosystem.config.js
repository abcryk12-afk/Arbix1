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
        PORT: 5000
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
      max_memory_restart: '512M'
    }
  ]
};
