import fs from 'fs';
import path from 'process';

console.log('Verifying handoff documents...');
// Simple verification that documents exist and aren't completely empty
const docs = [
  'docs/workstreams/task-1/HANDOFF.md',
  'docs/workstreams/task-2/HANDOFF.md',
  'docs/workstreams/task-3/HANDOFF.md'
];

let allValid = true;
for (const doc of docs) {
  if (fs.existsSync(doc)) {
    const content = fs.readFileSync(doc, 'utf-8');
    if (content.trim().length < 50) {
      console.warn(`Warning: ${doc} seems too short or empty.`);
      allValid = false;
    }
  } else {
    console.error(`Error: ${doc} is missing.`);
    allValid = false;
  }
}

if (!allValid) {
  process.exit(1);
} else {
  console.log('Handoff verification passed.');
}
