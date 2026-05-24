import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, setSessionCookie, touchLastLogin, type AdminRole } from '@/lib/auth';

const Body = z.object({ username: z.string().min(1), password: z.string().min(1) });

async function ensureSeedAdmin(username: string) {
  const seedUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  if (username !== seedUsername) return null;

  const adminCount = await db.adminUser.count();
  if (adminCount > 0) return null;

  return db.adminUser.create({
    data: {
      username: seedUsername,
      passwordHash: await bcrypt.hash(seedPassword, 10),
      fullName: 'Owner',
      role: 'SUPER_ADMIN'
    }
  });
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const seedUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const seedMatches = parsed.data.username === seedUsername && parsed.data.password === seedPassword;

  let user = null;
  try {
    user =
      (await db.adminUser.findUnique({ where: { username: parsed.data.username } })) ??
      (await ensureSeedAdmin(parsed.data.username));
  } catch (error) {
    console.error('Admin login database unavailable; using seed fallback when credentials match.', error);
    if (seedMatches) {
      const token = await createSession({ userId: 'seed-admin', username: seedUsername, role: 'SUPER_ADMIN' });
      await setSessionCookie(token);
      return NextResponse.json({ ok: true, fallback: true });
    }
  }

  if (!user || !user.isActive) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = await createSession({ userId: user.id, username: user.username, role: user.role as AdminRole });
  await setSessionCookie(token);
  await touchLastLogin(user.id).catch((error) => {
    console.error('Could not update admin last login.', error);
  });
  return NextResponse.json({ ok: true });
}
