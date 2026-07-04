import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  if (pathname === '/login') {
    const token = req.cookies.get(COOKIE)?.value;
    if (token) {
      const user = await verifySession(token);
      if (user) return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  const user = await verifySession(token);
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  // Admin routes require NIA_ADMIN or ADMIN role (training lab is open to all authenticated users)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/training') && !pathname.startsWith('/admin/site')) {
    if (user.role !== 'NIA_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
