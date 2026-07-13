import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Primera línea solamente: redirige y refresca la sesión. La autorización real
// vive en requireAdmin() dentro de cada server action (lib/auth.js).
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } = {} } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';

  if (!isLoginPage && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
