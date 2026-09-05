const { execSync } = require('child_process');

try {
  console.log('Killing process on port 3005...');
  execSync('fuser -k 3005/tcp || true', { stdio: 'inherit' });
  console.log('Starting Next.js dev server...');
  // O usuário precisa rodar npm run dev
} catch (e) {
  console.error(e);
}
