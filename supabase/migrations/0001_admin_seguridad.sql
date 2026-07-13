-- ============================================================
-- Fase 1A — Bloque de seguridad (B3, B9, M15, M16, M17)
-- Alcance limitado: SOLO tablas administrativas y de rate limiting.
-- El modelo de contenido (§2.2 de PLAN.md) sigue congelado (NO GO).
-- Aplicar en el SQL Editor del dashboard de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. admin_usuarios — B9: la identidad autenticada (auth.users),
--    el rol que autoriza, el autor en bitácora y el estado activo
--    son la misma cosa, no registros paralelos.
-- ------------------------------------------------------------
create table if not exists public.admin_usuarios (
  id        uuid primary key references auth.users (id) on delete cascade,
  nombre    text not null,
  email     text not null unique,
  rol       text not null check (rol in ('editor', 'admin')),
  activo    boolean not null default true,
  creado_at timestamptz not null default now()
);

alter table public.admin_usuarios enable row level security;

-- Cada usuario autenticado solo puede leer su propia fila.
-- Escrituras: únicamente vía service role (server actions autorizadas).
drop policy if exists admin_usuarios_leer_propio on public.admin_usuarios;
create policy admin_usuarios_leer_propio
  on public.admin_usuarios for select
  to authenticated
  using (id = auth.uid());

-- ------------------------------------------------------------
-- 2. admin_bitacora — M17-7: quién publicó/verificó/editó qué y cuándo.
--    Sin políticas: solo el service role escribe y lee.
-- ------------------------------------------------------------
create table if not exists public.admin_bitacora (
  id         bigint generated always as identity primary key,
  admin_id   uuid not null references auth.users (id),
  accion     text not null,
  entidad    text not null,
  entidad_id text,
  detalle    jsonb,
  creado_at  timestamptz not null default now()
);

alter table public.admin_bitacora enable row level security;

create index if not exists admin_bitacora_admin_idx
  on public.admin_bitacora (admin_id, creado_at desc);

-- ------------------------------------------------------------
-- 3. propuestas_intentos — rate limiting del formulario público (M16).
--    Guarda hash de IP (no la IP) y fecha; en Vercel la memoria del
--    proceso no persiste entre invocaciones, por eso vive en la base.
--    Sin políticas: solo el service role.
-- ------------------------------------------------------------
create table if not exists public.propuestas_intentos (
  id        bigint generated always as identity primary key,
  ip_hash   text not null,
  creado_at timestamptz not null default now()
);

alter table public.propuestas_intentos enable row level security;

create index if not exists propuestas_intentos_ip_idx
  on public.propuestas_intentos (ip_hash, creado_at desc);

-- ------------------------------------------------------------
-- 4. Revocar la escritura anónima directa (M16): el formulario ahora
--    pasa por server action; el navegador ya no inserta con la anon key.
-- ------------------------------------------------------------

-- 4a. Quitar toda política de INSERT/UPDATE/DELETE sobre propuestas
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'propuestas'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy %I on public.propuestas', p.policyname);
  end loop;
end $$;

-- 4b. Quitar políticas de escritura del bucket "propuestas" en storage.
--     La subida ahora es con URL firmada de un solo uso emitida por el servidor.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and (coalesce(qual, '') like '%propuestas%' or coalesce(with_check, '') like '%propuestas%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- 4c. Límites del bucket impuestos por Supabase (aplican también a URLs firmadas)
update storage.buckets
set file_size_limit    = 5242880, -- 5 MB por archivo
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'propuestas';
