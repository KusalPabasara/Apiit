// ==============================================
// PM2 ECOSYSTEM CONFIG FOR PROJECT AEGIS
// File: ecosystem.config.cjs
// ==============================================

module.exports = {
  apps: [
    {
      name: 'aegis-api',
      script: './src/index.js',
      cwd: '/var/www/aegis/backend',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      
      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
        JWT_SECRET: 'aegis_production_secret_key_change_in_production_2024',
        JWT_EXPIRES_IN: '30d',
        CORS_ORIGIN: 'http://152.42.185.253',
        DB_PATH: './data/db.json'
      },
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/aegis/api-error.log',
      out_file: '/var/log/aegis/api-out.log',
      merge_logs: true,
      
      // Auto-restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Health monitoring
      exp_backoff_restart_delay: 100,
      
      // Kill timeout
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: '152.42.185.253',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/project-aegis.git',
      path: '/var/www/aegis',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
