import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isNoCookiePage = request.nextUrl.pathname === '/wrong-pages/no-cookie';

  if (!isLoggedIn && !isLoginPage && !isNoCookiePage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 