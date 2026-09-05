const { execSync } = require('child_process');

try {
  console.log('Killing process on port 3005...');
  execSync('fuser -k 3005/tcp || true', { stdio: 'inherit' });
  console.log('Starting Next.js dev server...');
  // We don't want this script to block, so we'll just instruct the user to run it
} catch (e) {
  console.error(e);
}
