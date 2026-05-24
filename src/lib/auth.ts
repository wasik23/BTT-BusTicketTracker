import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

const COOKIE_NAME = 'btt_admin';
const ALG = 'HS256';
const FALLBACK_SECRET = 'btt-local-compatible-fallback-secret-please-change';

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
    ? process.env.JWT_SECRET
    : FALLBACK_SECRET;
  return new TextEncoder().encode(raw);
}

export interface AdminSession {
  userId: string;
  username: string;
  role: AdminRole;
}

export async function createSession(session: AdminSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as AdminRole
    };
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

export async function touchLastLogin(userId: string): Promise<void> {
  if (userId === 'seed-admin') return;
  await db.adminUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}
