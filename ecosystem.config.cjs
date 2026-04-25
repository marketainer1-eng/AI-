module.exports = {
  apps: [{
    name: 'exam-certification',
    script: 'npx',
    args: 'next start --port 3000',
    cwd: '/home/user/exam-certification',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    watch: false,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M'
  }]
}
