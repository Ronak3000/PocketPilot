import { execSync } from 'child_process';

console.log('Running smoke test...');

try {
  execSync('pnpm run build', { stdio: 'inherit' });
  console.log('Smoke test passed: Project builds successfully.');
} catch (e) {
  console.error('Smoke test failed.');
  process.exit(1);
}
