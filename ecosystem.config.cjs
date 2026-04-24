module.exports = {
  apps: [
    {
      name: 'exam-certification',
      script: 'node_modules/.bin/next',
      args: 'dev --port 3000 --hostname 0.0.0.0 --turbopack',
      cwd: '/home/user/exam-certification',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    },
  ],
}
