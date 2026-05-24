#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function loadDotEnv() {
  if (!existsSync('.env')) return;

  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadDotEnv();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('paste-your-postgres-url-here')) {
  console.error('DATABASE_URL is not set. Put your production Postgres URL in .env, then rerun npm run db:deploy.');
  process.exit(0);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('npx', ['prisma', 'db', 'push', '--accept-data-loss', '--skip-generate']);
run('npm', ['run', 'db:seed']);
