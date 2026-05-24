#!/usr/bin/env node
// One-command first-time setup. Run with: npm run setup
// Idempotent — safe to run again later.

import { existsSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

console.log('BTT — first-time setup');

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  console.log('✓ Created .env from .env.example');
} else {
  console.log('✓ .env already exists — keeping it');
}

run('npx prisma generate');
run('npx prisma db push --accept-data-loss --skip-generate');
run('npm run db:seed');

console.log('\n✅ Setup complete!');
console.log('   Start the dev server with:   npm run dev');
console.log('   Then open:                   http://localhost:3000');
console.log('   Admin login:                 admin / admin123');
