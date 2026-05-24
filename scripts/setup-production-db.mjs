#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set; skipping production database setup.');
  process.exit(0);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('npx', ['prisma', 'db', 'push', '--accept-data-loss', '--skip-generate']);
run('npm', ['run', 'db:seed']);
