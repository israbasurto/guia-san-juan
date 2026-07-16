// Prueba de la migración 0002 en un Postgres real aislado (PGlite, sin Docker).
// Recrea el entorno que Supabase provee (esquema auth, roles anon/service_role,
// admin_usuarios de la 0001), aplica 0002 TAL CUAL, y verifica:
//   - estructura (tablas y enums creados)
//   - RLS-1: anon NO lee tablas privadas ni entidades en borrador
//   - RLS-2: anon lee la proyección/hijas SOLO de entidades publicadas
//
// Uso:  node scripts/probar-migracion.mjs   (o: pnpm probar-migracion)
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const db = new PGlite();
const q = async (sql, params) => (await db.query(sql, params)).rows;
const conteo = async (sql) => Number((await db.query(sql)).rows[0].n);

let fallos = 0;
const check = (nombre, ok, detalle = '') => {
  if (!ok) fallos++;
  console.log(`${ok ? 'PASA ' : 'FALLA'} ${nombre}${detalle ? '  — ' + detalle : ''}`);
};

// ------------------------------------------------------------
// 1. Entorno que Supabase provee (no es parte de la migración)
// ------------------------------------------------------------
await db.exec(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key);
  create role anon;
  create role authenticated;
  create role service_role;
  -- admin_usuarios tal como la deja la migración 0001 (B9)
  create table public.admin_usuarios (
    id uuid primary key references auth.users(id) on delete cascade,
    nombre text not null, email text not null unique,
    rol text not null check (rol in ('editor','admin')),
    activo boolean not null default true,
    creado_at timestamptz not null default now()
  );
`);

// ------------------------------------------------------------
// 2. Aplicar la migración 0002 TAL CUAL
// ------------------------------------------------------------
const sql0002 = readFileSync('supabase/migrations/0002_modelo_contenido.sql', 'utf8');
try {
  await db.exec(sql0002);
  check('migración 0002 aplica sin errores', true);
} catch (e) {
  check('migración 0002 aplica sin errores', false, e.message);
  console.log('\nNo se puede continuar.'); process.exit(1);
}

// Supabase concede a anon acceso a las tablas de public por defecto; la barrera
// real es RLS. Lo replicamos para probar RLS (no la ausencia de grant).
await db.exec(`
  grant usage on schema public to anon;
  grant select on all tables in schema public to anon;
`);

// ------------------------------------------------------------
// 3. Estructura: tablas y enums esperados
// ------------------------------------------------------------
const esperadas = [
  'dependencias','dependencia_horarios','dependencia_horarios_excepciones','dependencia_telefonos',
  'categorias_tramite','tramites','tramite_horarios','fuentes','tramite_fuentes','dependencia_fuentes',
  'costos_tramite','representacion_tramite','tramite_verificaciones','dependencia_verificaciones',
  'tramite_evidencias','dependencia_evidencias','tramite_historial','dependencia_historial',
  'tramite_reportes','dependencia_reportes','directorio','directorio_telefonos','directorio_fuentes',
  'directorio_verificaciones','directorio_evidencias','directorio_historial','directorio_reportes',
  'guias','guias_tramites','legal_versiones','busquedas_sin_resultado','verificacion_publica',
];
const tablas = (await q(`select table_name from information_schema.tables where table_schema='public'`)).map((r) => r.table_name);
const faltan = esperadas.filter((t) => !tablas.includes(t));
check(`32 tablas de contenido creadas`, faltan.length === 0, faltan.length ? 'faltan: ' + faltan.join(', ') : `${esperadas.length} presentes`);

const enums = (await q(`select typname from pg_type where typtype='e'`)).map((r) => r.typname);
const enumsEsperados = ['estado_editorial','cta_estado','costo_categoria','grupo_tramite','verif_resultado','fuente_tipo'];
check('enums clave creados', enumsEsperados.every((e) => enums.includes(e)), `${enums.length} enums`);

// FK real de evidencias (B7): tramite_evidencias.verificacion_id → tramite_verificaciones
const fkEvid = await q(`
  select 1 from information_schema.table_constraints tc
  join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
  where tc.table_name='tramite_evidencias' and tc.constraint_type='FOREIGN KEY'
    and ccu.table_name='tramite_verificaciones'`);
check('B7: tramite_evidencias con FK real a tramite_verificaciones', fkEvid.length > 0);

// ------------------------------------------------------------
// 4. Semilla (como superusuario): una entidad publicada y una en borrador
// ------------------------------------------------------------
const U = '11111111-1111-1111-1111-111111111111';
await db.exec(`insert into auth.users(id) values ('${U}');`);
await db.exec(`insert into public.admin_usuarios(id,nombre,email,rol) values ('${U}','Tester','t@t.mx','admin');`);

const uno = async (sql) => (await db.query(sql)).rows[0];
const fuente = await uno(`insert into fuentes(tipo,descripcion) values ('web','x') returning id`);
const depPub = await uno(`insert into dependencias(slug,nombre,estado) values ('dep-pub','Dep Pública','publicado') returning id`);
const depBor = await uno(`insert into dependencias(slug,nombre,estado) values ('dep-bor','Dep Borrador','borrador') returning id`);
await db.query(`insert into dependencia_telefonos(dependencia_id,numero) values ($1,'427-100'),($2,'427-999')`, [depPub.id, depBor.id]);
const trPub = await uno(`insert into tramites(slug,nombre,dependencia_id,estado) values ('tr-pub','Trámite Público','${depPub.id}','publicado') returning id`);
const trBor = await uno(`insert into tramites(slug,nombre,dependencia_id,estado) values ('tr-bor','Trámite Borrador','${depBor.id}','borrador') returning id`);
await db.query(`insert into costos_tramite(tramite_id,concepto,categoria,tipo) values ($1,'Derecho','derecho','fijo'),($2,'Derecho','derecho','fijo')`, [trPub.id, trBor.id]);
const ver = await uno(`insert into tramite_verificaciones(tramite_id,grupo,resultado,verificado_por) values ('${trPub.id}','costos','confirmado','${U}') returning id`);
await db.query(`insert into tramite_evidencias(verificacion_id,tipo) values ($1,'captura')`, [ver.id]);
await db.query(`insert into representacion_tramite(tramite_id) values ($1)`, [trPub.id]);
await db.query(`insert into busquedas_sin_resultado(consulta_normalizada) values ('acta nacimiento')`);
// proyección pública: filas para publicado y para borrador
await db.query(`insert into verificacion_publica(entidad_tipo,entidad_id,grupo,fecha) values
  ('tramite',$1,'costos',current_date), ('tramite',$2,'costos',current_date),
  ('dependencia',$3,'contacto',current_date), ('dependencia',$4,'contacto',current_date)`,
  [trPub.id, trBor.id, depPub.id, depBor.id]);

// ------------------------------------------------------------
// 5. RLS-1 — como anon: privadas y borradores NO se leen
// ------------------------------------------------------------
await db.exec(`set role anon;`);

for (const t of ['fuentes','tramite_verificaciones','tramite_evidencias','representacion_tramite','busquedas_sin_resultado']) {
  check(`RLS-1 anon no lee privada ${t}`, (await conteo(`select count(*) n from ${t}`)) === 0);
}
check('RLS-1 anon solo ve trámites publicados', (await conteo(`select count(*) n from tramites`)) === 1);
check('RLS-1 anon solo ve dependencias publicadas', (await conteo(`select count(*) n from dependencias`)) === 1);
check('RLS-1 anon no ve teléfonos de dependencia en borrador', (await conteo(`select count(*) n from dependencia_telefonos`)) === 1);
check('RLS-1 anon no ve costos de trámite en borrador', (await conteo(`select count(*) n from costos_tramite`)) === 1);

// ------------------------------------------------------------
// 6. RLS-2 — como anon: proyección solo de entidades publicadas
// ------------------------------------------------------------
check('RLS-2 anon lee proyección solo de publicados', (await conteo(`select count(*) n from verificacion_publica`)) === 2);
const proj = await q(`select entidad_tipo, entidad_id from verificacion_publica order by entidad_tipo`);
const soloPublicados = proj.every((r) => r.entidad_id === trPub.id || r.entidad_id === depPub.id);
check('RLS-2 la proyección no filtra ninguna entidad en borrador', soloPublicados);

// control positivo: anon sí ve el contenido publicado
check('positivo: anon lee la dependencia publicada y su teléfono',
  (await conteo(`select count(*) n from dependencia_telefonos`)) === 1 &&
  (await conteo(`select count(*) n from dependencias where slug='dep-pub'`)) === 1);

await db.exec(`reset role;`);
await db.close();

console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLO(S)'} — migración 0002`);
process.exit(fallos ? 1 : 0);
