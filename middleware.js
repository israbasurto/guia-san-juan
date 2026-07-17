import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// CSP por grupo de rutas (TRI-223):
//  · /admin  → estricto con NONCE (ya es dinámico; Next inyecta el nonce a sus
//              scripts inline). Sin 'unsafe-inline'.
//  · público → 'unsafe-inline' (obligado por los scripts RSC de Next), pero
//              ENFORCED y con el resto de directivas endurecidas. Conserva SSG.
function construirCsp(scriptSrc) {
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

const CSP_PUBLICO = construirCsp("script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com");

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const esAdmin = pathname.startsWith('/admin');

  if (!esAdmin) {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', CSP_PUBLICO);
    return response;
  }

  // --- /admin: nonce estricto + refresco de sesión + guardia de auth ---
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = construirCsp(`script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com`);

  // El CSP en los headers de REQUEST hace que Next nonce sus scripts inline.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', csp);
  requestHeaders.set('x-nonce', nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } = {} } = await supabase.auth.getUser();
  const isLoginPage = pathname === '/admin/login';

  if (!isLoginPage && !user) {
    const r = NextResponse.redirect(new URL('/admin/login', request.url));
    r.headers.set('Content-Security-Policy', csp);
    return r;
  }
  if (isLoginPage && user) {
    const r = NextResponse.redirect(new URL('/admin', request.url));
    r.headers.set('Content-Security-Policy', csp);
    return r;
  }

  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Todas las rutas de documento; se excluyen estáticos y assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
