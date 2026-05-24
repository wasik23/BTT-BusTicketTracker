import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_PREFIX = '/admin';
const LOGIN_PATH = '/admin/login';
const COOKIE_NAME = 'btt_admin';

async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(PROTECTED_PREFIX) || pathname === LOGIN_PATH) {
    return NextResponse.next();
  }
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await isValidToken(token))) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
