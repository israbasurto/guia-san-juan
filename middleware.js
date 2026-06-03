import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const hasSession = request.cookies.get('gsj-admin')?.value === '1';

  if (!isLoginPage && !hasSession) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (isLoginPage && hasSession) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
