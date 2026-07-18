import { execSync } from 'child_process';
import process from 'process';

const ALLOWED_PATHS = {
  'task-1-product-ui': [
    'src/app/',
    'src/components/',
    'src/features/',
    'src/mocks/',
    'src/styles/',
    'public/',
    'tests/e2e/',
    'docs/workstreams/task-1/',
    'docs/integration-requests/task-1-requests.md'
  ],
  'task-2-finance-engine': [
    'src/core/finance/',
    'tests/finance/',
    'tests/fixtures/',
    'docs/workstreams/task-2/',
    'docs/integration-requests/task-2-requests.md'
  ],
  'task-3-platform-ai': [
    'src/contracts/',
    'src/core/ai/',
    'src/server/',
    'src/app/api/',
    'supabase/',
    'tests/ai/',
    'tests/integration/',
    'docs/workstreams/task-3/',
    'docs/integration-requests/task-3-requests.md',
    'docs/CONTRACT_CHANGELOG.md'
  ]
};

const EXCLUDED_PATHS = {
  'task-1-product-ui': ['src/app/api/']
};

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (branch === 'main') {
    console.log('On main branch. Ownership check skipped.');
    process.exit(0);
  }

  const allowedPaths = ALLOWED_PATHS[branch];
  if (!allowedPaths) {
    if (process.env.SKIP_OWNERSHIP_CHECK === 'true') {
      console.log('Unknown branch, but SKIP_OWNERSHIP_CHECK is true.');
      process.exit(0);
    }
    console.error(`Error: Unknown branch "${branch}". Must be one of: ${Object.keys(ALLOWED_PATHS).join(', ')}`);
    process.exit(1);
  }

  const excludedPaths = EXCLUDED_PATHS[branch] || [];
  
  // Use main as base, assuming it exists
  const diffOutput = execSync('git diff --name-only main...HEAD').toString().trim();
  if (!diffOutput) {
    console.log('No files changed.');
    process.exit(0);
  }

  const changedFiles = diffOutput.split('\n');
  const unauthorizedFiles = [];

  for (const file of changedFiles) {
    const isExcluded = excludedPaths.some(ep => file.startsWith(ep));
    const isAllowed = !isExcluded && allowedPaths.some(ap => file.startsWith(ap));
    const isSharedAllowed = process.env.ALLOW_SHARED_FILES === 'true';

    if (!isAllowed) {
      if (isSharedAllowed && (file === 'package.json' || file === 'pnpm-lock.yaml' || file.endsWith('config.ts') || file.startsWith('docs/'))) {
        continue;
      }
      unauthorizedFiles.push(file);
    }
  }

  if (unauthorizedFiles.length > 0) {
    console.error(`Error: Branch "${branch}" modified unauthorized files:`);
    unauthorizedFiles.forEach(f => console.error(` - ${f}`));
    console.error('If modifying shared files, set ALLOW_SHARED_FILES=true');
    process.exit(1);
  }

  console.log('Ownership check passed.');
} catch (error) {
  console.error('Failed to run ownership check:', error.message);
  process.exit(1);
}
