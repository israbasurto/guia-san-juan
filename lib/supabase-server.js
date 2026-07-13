import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Cliente de servidor ligado a las cookies de sesión (anon key + Supabase Auth).
// Para escrituras privilegiadas usar supabaseAdmin DESPUÉS de requireAdmin().
export async function createSupabaseServer() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Llamado desde un Server Component: las cookies las refresca el middleware
          }
        },
      },
    }
  );
}
