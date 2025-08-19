#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Auto-running database schema check...\n');

// Path to the main script
const scriptPath = join(__dirname, 'check-missing-columns.js');

// Run the schema check script
const child = spawn('node', [scriptPath], {
  stdio: 'inherit',
  shell: true
});

// Handle process events
child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Schema check completed successfully!');
  } else {
    console.log(`\n❌ Schema check failed with exit code ${code}`);
  }
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Failed to start schema check script:', error);
  process.exit(1);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT, terminating child process...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, terminating child process...');
  child.kill('SIGTERM');
});
