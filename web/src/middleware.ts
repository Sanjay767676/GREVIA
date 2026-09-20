import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, SESSION_COOKIE } from './lib/session';

const PROTECTED_PREFIXES = ['/user', '/worker', '/hod', '/principal'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*', '/worker/:path*', '/hod/:path*', '/principal/:path*'],
};
