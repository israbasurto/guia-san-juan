-- ============================================================
-- Fase 1B — Modelo de contenido §2.2 (congelado v1)
-- Deriva de docs/modelo/modelo-contenido-v1.md y docs/modelo/matriz-invalidacion.md.
-- Cierra en esquema: B7 (evidencias FK real), B8 (editorial/comercial),
-- M18 (proyección pública), M19 (honorarios únicos). B9 ya en 0001, M20 en triggers (0003).
--
-- Alcance de ESTA migración: tablas, tipos, FKs, constraints y RLS.
-- Los TRIGGERS de la matriz de invalidación y el mantenimiento de
-- verificacion_publica van en 0003 (con su suite TI-1..TI-6).
--
-- Precondición: 0001 (admin_usuarios, sobre auth.users).
-- Aplicar con: supabase db push  (o SQL editor). Probar antes: pnpm probar-migracion.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Tipos (enums)
-- ------------------------------------------------------------
create type estado_editorial as enum ('borrador','en_revision','publicado','vencido','retirado');
create type cta_estado       as enum ('oculto','proximamente','activo');
create type costo_categoria  as enum ('derecho','honorario','gasto','otro');
create type costo_tipo       as enum ('fijo','rango','desde','desconocido');
create type repr_tipo        as enum ('no_aplica','carta_simple','notarial');
create type conf_op_estado   as enum ('pendiente_de_confirmar','confirmado','rechazado','vencido','requiere_revalidacion','no_ofrecido');
create type rev_jur_estado   as enum ('pendiente','aprobada','rechazada','vencida');
create type verif_resultado  as enum ('confirmado','cambio_detectado','conflicto_entre_fuentes','no_localizable');
create type evidencia_tipo   as enum ('captura','archivo_oficial','correo','nota_telefonica');
create type evidencia_clasif as enum ('interna','publicable');
create type fuente_tipo      as enum ('web','telefono','presencial','documento_oficial');
create type grupo_tramite     as enum ('requisitos','costos','contacto','ubicacion','horarios_propios','representacion');
create type grupo_dependencia as enum ('contacto','ubicacion','horarios');
create type grupo_directorio  as enum ('contacto','ubicacion');
create type legal_documento   as enum ('disclaimer','aviso_privacidad','terminos');

-- ------------------------------------------------------------
-- 1. Dependencias y tablas hijas
-- ------------------------------------------------------------
create table dependencias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  direccion text, lat numeric, lng numeric,
  email text, sitio_oficial_url text,
  estado estado_editorial not null default 'borrador',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table dependencia_horarios (
  id uuid primary key default gen_random_uuid(),
  dependencia_id uuid not null references dependencias(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  abre time not null, cierra time not null
);

create table dependencia_horarios_excepciones (
  id uuid primary key default gen_random_uuid(),
  dependencia_id uuid not null references dependencias(id) on delete cascade,
  fecha date not null, motivo text,
  cerrado boolean not null default true, abre time, cierra time
);

create table dependencia_telefonos (
  id uuid primary key default gen_random_uuid(),
  dependencia_id uuid not null references dependencias(id) on delete cascade,
  etiqueta text, numero text not null, extension text,
  confirmado boolean not null default false
);

-- ------------------------------------------------------------
-- 2. Categorías y trámites
-- ------------------------------------------------------------
create table categorias_tramite (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, nombre text not null, orden int not null default 0
);

create table tramites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null, resumen text, descripcion_md text,
  categoria_id uuid references categorias_tramite(id),
  dependencia_id uuid references dependencias(id),   -- retiro bloqueado por FK (no cascade)
  requisitos jsonb, tiempo_estimado text,
  documentos jsonb, faqs jsonb,
  cta_estado cta_estado not null default 'oculto',              -- M5
  grupos_obligatorios text[] not null default '{}',             -- B8: grupos editoriales exigidos
  estado estado_editorial not null default 'borrador',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
  -- M19: SIN precio_honorarios
);

create table tramite_horarios (        -- M21: solo si el trámite tiene horarios propios
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references tramites(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  abre time not null, cierra time not null
);

-- ------------------------------------------------------------
-- 3. Proveniencia: fuentes (privada) + relación por entidad (FK real, B5)
-- ------------------------------------------------------------
create table fuentes (
  id uuid primary key default gen_random_uuid(),
  url text, tipo fuente_tipo not null, descripcion text,
  hash_contenido text                    -- se llena al automatizar el monitoreo (Fase 3)
);

create table tramite_fuentes     ( tramite_id     uuid not null references tramites(id)     on delete cascade, fuente_id uuid not null references fuentes(id) on delete cascade, primary key (tramite_id, fuente_id) );
create table dependencia_fuentes ( dependencia_id uuid not null references dependencias(id) on delete cascade, fuente_id uuid not null references fuentes(id) on delete cascade, primary key (dependencia_id, fuente_id) );

-- ------------------------------------------------------------
-- 4. Costos (M12+M19: única fuente de verdad de todo costo)
-- ------------------------------------------------------------
create table costos_tramite (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references tramites(id) on delete cascade,
  concepto text not null,
  categoria costo_categoria not null,
  tipo costo_tipo not null,
  importe_min numeric, importe_max numeric, moneda char(3) not null default 'MXN',
  condiciones text,
  vigencia_inicio date, vigencia_fin date,
  fuente_id uuid references fuentes(id)
);

-- ------------------------------------------------------------
-- 5. Representación (M11: dos controles separados) — preparación COMERCIAL (B8)
-- ------------------------------------------------------------
create table representacion_tramite (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references tramites(id) on delete cascade,
  jurisdiccion text, oficina text, tipo_solicitante text,
  tipo_representacion repr_tipo not null default 'no_aplica',
  fuente_normativa text, fecha_vigencia date, restricciones text, version int not null default 1,
  confirmacion_operativa_estado conf_op_estado not null default 'pendiente_de_confirmar',
  confirmado_por uuid references admin_usuarios(id), confirmado_en timestamptz,
  revision_juridica_estado rev_jur_estado not null default 'pendiente',
  revisado_por uuid references admin_usuarios(id), revisado_en timestamptz
);

-- ------------------------------------------------------------
-- 6. Verificación por grupo (B4) — privada. Patrón repetido por entidad.
-- ------------------------------------------------------------
create table tramite_verificaciones (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references tramites(id) on delete cascade,
  grupo grupo_tramite not null,
  valor_verificado jsonb,
  fuente_id uuid references fuentes(id),
  resultado verif_resultado not null,
  invalidada_en timestamptz,             -- set por trigger de la matriz (0003); NULL = vigente
  notas text,
  verificado_por uuid not null references admin_usuarios(id),
  verificado_en timestamptz not null default now()
);

create table dependencia_verificaciones (
  id uuid primary key default gen_random_uuid(),
  dependencia_id uuid not null references dependencias(id) on delete cascade,
  grupo grupo_dependencia not null,
  valor_verificado jsonb,
  fuente_id uuid references fuentes(id),
  resultado verif_resultado not null,
  invalidada_en timestamptz,
  notas text,
  verificado_por uuid not null references admin_usuarios(id),
  verificado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 7. Evidencias SIN polimorfismo (B7) — FK real a la verificación específica. Privada.
-- ------------------------------------------------------------
create table tramite_evidencias (
  id uuid primary key default gen_random_uuid(),
  verificacion_id uuid not null references tramite_verificaciones(id) on delete cascade,
  tipo evidencia_tipo not null,
  clasificacion evidencia_clasif not null default 'interna',
  contiene_datos_personales boolean not null default false,
  retener_hasta date, ruta_privada text
);

create table dependencia_evidencias (
  id uuid primary key default gen_random_uuid(),
  verificacion_id uuid not null references dependencia_verificaciones(id) on delete cascade,
  tipo evidencia_tipo not null,
  clasificacion evidencia_clasif not null default 'interna',
  contiene_datos_personales boolean not null default false,
  retener_hasta date, ruta_privada text
);

-- ------------------------------------------------------------
-- 8. Historial y reportes por entidad (FK real, B5) — privados
-- ------------------------------------------------------------
create table tramite_historial     ( id uuid primary key default gen_random_uuid(), tramite_id     uuid not null references tramites(id)     on delete cascade, diff jsonb, autor uuid references admin_usuarios(id), creado_en timestamptz not null default now() );
create table dependencia_historial ( id uuid primary key default gen_random_uuid(), dependencia_id uuid not null references dependencias(id) on delete cascade, diff jsonb, autor uuid references admin_usuarios(id), creado_en timestamptz not null default now() );
create table tramite_reportes      ( id uuid primary key default gen_random_uuid(), tramite_id     uuid not null references tramites(id)     on delete cascade, mensaje text, creado_en timestamptz not null default now(), atendido boolean not null default false );
create table dependencia_reportes  ( id uuid primary key default gen_random_uuid(), dependencia_id uuid not null references dependencias(id) on delete cascade, mensaje text, creado_en timestamptz not null default now(), atendido boolean not null default false );

-- ------------------------------------------------------------
-- 9. Directorio + hijas
-- ------------------------------------------------------------
create table directorio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, categoria text, direccion text,
  estado estado_editorial not null default 'borrador',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create table directorio_telefonos     ( id uuid primary key default gen_random_uuid(), directorio_id uuid not null references directorio(id) on delete cascade, etiqueta text, numero text not null, extension text, confirmado boolean not null default false );
create table directorio_fuentes        ( directorio_id uuid not null references directorio(id) on delete cascade, fuente_id uuid not null references fuentes(id) on delete cascade, primary key (directorio_id, fuente_id) );
create table directorio_verificaciones ( id uuid primary key default gen_random_uuid(), directorio_id uuid not null references directorio(id) on delete cascade, grupo grupo_directorio not null, valor_verificado jsonb, fuente_id uuid references fuentes(id), resultado verif_resultado not null, invalidada_en timestamptz, notas text, verificado_por uuid not null references admin_usuarios(id), verificado_en timestamptz not null default now() );
create table directorio_evidencias     ( id uuid primary key default gen_random_uuid(), verificacion_id uuid not null references directorio_verificaciones(id) on delete cascade, tipo evidencia_tipo not null, clasificacion evidencia_clasif not null default 'interna', contiene_datos_personales boolean not null default false, retener_hasta date, ruta_privada text );
create table directorio_historial      ( id uuid primary key default gen_random_uuid(), directorio_id uuid not null references directorio(id) on delete cascade, diff jsonb, autor uuid references admin_usuarios(id), creado_en timestamptz not null default now() );
create table directorio_reportes       ( id uuid primary key default gen_random_uuid(), directorio_id uuid not null references directorio(id) on delete cascade, mensaje text, creado_en timestamptz not null default now(), atendido boolean not null default false );

-- ------------------------------------------------------------
-- 10. Guías (+ puente) y legal
-- ------------------------------------------------------------
create table guias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, titulo text not null, resumen text, contenido_md text,
  publicado_en timestamptz, actualizado_en timestamptz not null default now(),
  estado estado_editorial not null default 'borrador'
);
create table guias_tramites ( guia_id uuid not null references guias(id) on delete cascade, tramite_id uuid not null references tramites(id) on delete cascade, primary key (guia_id, tramite_id) );

create table legal_versiones (
  id uuid primary key default gen_random_uuid(),
  documento legal_documento not null, version int not null, texto text not null,
  vigente_desde timestamptz not null default now()
);

create table busquedas_sin_resultado (
  id uuid primary key default gen_random_uuid(),
  consulta_normalizada text not null, veces int not null default 1, ultima_vez timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 11. M18 — Proyección pública (SOLO columnas seguras; sin puerta trasera).
--     Se mantiene por trigger (0003); aquí solo la tabla + su RLS de lectura.
-- ------------------------------------------------------------
create table verificacion_publica (
  entidad_tipo text not null check (entidad_tipo in ('tramite','dependencia','directorio')),
  entidad_id uuid not null,
  grupo text not null,
  fecha date not null,
  primary key (entidad_tipo, entidad_id, grupo)
);

-- ============================================================
-- RLS — B5/M14/M18
-- ============================================================
alter table dependencias                     enable row level security;
alter table dependencia_horarios             enable row level security;
alter table dependencia_horarios_excepciones enable row level security;
alter table dependencia_telefonos            enable row level security;
alter table categorias_tramite               enable row level security;
alter table tramites                         enable row level security;
alter table tramite_horarios                 enable row level security;
alter table fuentes                          enable row level security;
alter table tramite_fuentes                  enable row level security;
alter table dependencia_fuentes              enable row level security;
alter table costos_tramite                   enable row level security;
alter table representacion_tramite           enable row level security;
alter table tramite_verificaciones           enable row level security;
alter table dependencia_verificaciones       enable row level security;
alter table tramite_evidencias               enable row level security;
alter table dependencia_evidencias           enable row level security;
alter table tramite_historial                enable row level security;
alter table dependencia_historial            enable row level security;
alter table tramite_reportes                 enable row level security;
alter table dependencia_reportes             enable row level security;
alter table directorio                       enable row level security;
alter table directorio_telefonos             enable row level security;
alter table directorio_fuentes               enable row level security;
alter table directorio_verificaciones        enable row level security;
alter table directorio_evidencias            enable row level security;
alter table directorio_historial             enable row level security;
alter table directorio_reportes              enable row level security;
alter table guias                            enable row level security;
alter table guias_tramites                   enable row level security;
alter table legal_versiones                  enable row level security;
alter table busquedas_sin_resultado          enable row level security;
alter table verificacion_publica             enable row level security;

-- --- Entidades publicables: lectura anónima solo si estado='publicado' ---
create policy pub_dependencias on dependencias for select to anon using (estado = 'publicado');
create policy pub_tramites     on tramites     for select to anon using (estado = 'publicado');
create policy pub_directorio   on directorio   for select to anon using (estado = 'publicado');
create policy pub_guias        on guias        for select to anon using (estado = 'publicado');

-- Categorías y textos legales vigentes: contenido público de referencia
create policy pub_categorias on categorias_tramite for select to anon using (true);
create policy pub_legal      on legal_versiones    for select to anon using (true);

-- --- Tablas hijas públicas: demuestran que el PADRE está publicado ---
create policy pub_dep_horarios     on dependencia_horarios             for select to anon using (exists (select 1 from dependencias d where d.id = dependencia_id and d.estado = 'publicado'));
create policy pub_dep_horarios_exc on dependencia_horarios_excepciones for select to anon using (exists (select 1 from dependencias d where d.id = dependencia_id and d.estado = 'publicado'));
create policy pub_dep_tels         on dependencia_telefonos            for select to anon using (exists (select 1 from dependencias d where d.id = dependencia_id and d.estado = 'publicado'));
create policy pub_tram_horarios    on tramite_horarios                 for select to anon using (exists (select 1 from tramites t where t.id = tramite_id and t.estado = 'publicado'));
create policy pub_costos           on costos_tramite                   for select to anon using (exists (select 1 from tramites t where t.id = tramite_id and t.estado = 'publicado'));
create policy pub_dir_tels         on directorio_telefonos             for select to anon using (exists (select 1 from directorio x where x.id = directorio_id and x.estado = 'publicado'));
create policy pub_guias_tramites   on guias_tramites                   for select to anon using (exists (select 1 from guias g where g.id = guia_id and g.estado = 'publicado'));

-- --- Proyección pública (M18): fecha por grupo solo de entidades publicadas ---
create policy pub_verificacion on verificacion_publica for select to anon using (
  (entidad_tipo = 'tramite'     and exists (select 1 from tramites     t where t.id = entidad_id and t.estado = 'publicado')) or
  (entidad_tipo = 'dependencia' and exists (select 1 from dependencias d where d.id = entidad_id and d.estado = 'publicado')) or
  (entidad_tipo = 'directorio'  and exists (select 1 from directorio   x where x.id = entidad_id and x.estado = 'publicado'))
);

-- --- Privadas por defecto: fuentes, *_fuentes, *_verificaciones, *_evidencias,
--     *_historial, *_reportes, representacion, busquedas_sin_resultado.
--     RLS habilitado SIN política anon = sin lectura anónima. La escritura es
--     siempre por service role tras requireAdmin (§5.1). ---
