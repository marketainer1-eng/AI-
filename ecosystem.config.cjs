module.exports = {
  apps: [{
    name: 'exam-certification',
    script: 'node_modules/.bin/next',
    args: 'dev --port 3000',
    cwd: '/home/user/exam-certification',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: '1',
      TURBOPACK: '0',
      NODE_OPTIONS: '--max-old-space-size=500',
    },
    watch: false,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '550M'
  }]
}
