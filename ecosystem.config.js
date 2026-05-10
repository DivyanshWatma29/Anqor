module.exports = {
  apps: [
    {
      name: 'anqor',
      script: 'server/bff.js',
      instances: 'max',           // Use all CPU cores for zero-downtime
      exec_mode: 'cluster',       // Cluster mode for zero-downtime restarts
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8787,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 8788,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8787,
      },
      // Zero-downtime reload settings
      listen_timeout: 10000,
      kill_timeout: 5000,
      // Health check integration
      exp_backoff_restart_delay: 100,
      // Log configuration
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'anqor-staging',
      script: 'server/bff.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'staging',
        PORT: 8788,
      },
    },
  ],
};
