module.exports = {
  apps: [
    {
      name: 'skillhub',
      script: 'node_modules/.bin/next',
      args: 'start -p 3006',
      cwd: '/home/red/work/moneyboost/skillhub',
      env: {
        NODE_ENV: 'production',
        PORT: '3006',
      },
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/red/work/moneyboost/skillhub/logs/error.log',
      out_file: '/home/red/work/moneyboost/skillhub/logs/out.log',
    },
  ],
}
