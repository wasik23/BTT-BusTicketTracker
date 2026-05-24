#!/usr/bin/env node
// Vercel build step: rewrite the Prisma schema's provider from "sqlite" to
// "postgresql" so the same repo can run on SQLite locally and PostgreSQL
// (Neon) in production.
//
// This file is invoked from package.json "vercel-build".
// On Vercel the file system is writable during the build (only frozen at
// runtime), so this works.

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'prisma/schema.prisma';
const src = readFileSync(path, 'utf8');
const next = src.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

if (src === next) {
  console.log('schema.prisma already uses postgresql — nothing to do');
} else {
  writeFileSync(path, next);
  console.log('schema.prisma provider: sqlite -> postgresql');
}
