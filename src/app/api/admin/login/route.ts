import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, setSessionCookie, touchLastLogin } from '@/lib/auth';

const Body = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const user = await db.adminUser.findUnique({ where: { username: parsed.data.username } });
  if (!user || !user.isActive) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = await createSession({ userId: user.id, username: user.username, role: user.role });
  await setSessionCookie(token);
  await touchLastLogin(user.id);
  return NextResponse.json({ ok: true });
}
