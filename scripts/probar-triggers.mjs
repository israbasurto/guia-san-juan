// Prueba de los triggers de invalidación (0003) en PGlite.
// Verifica los dos mecanismos: (A) invalidación por edición (matriz M20, TI-1..TI-6)
// y (B) mantenimiento de la proyección pública (M18).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const db = new PGlite();
const U = '11111111-1111-1111-1111-111111111111';

let fallos = 0;
const check = (n, ok, det = '') => { if (!ok) fallos++; console.log(`${ok ? 'PASA ' : 'FALLA'} ${n}${det ? '  — ' + det : ''}`); };
const uno = async (sql, p) => (await db.query(sql, p)).rows[0];
const num = async (sql, p) => Number((await db.query(sql, p)).rows[0].n);

// vigente = verificación confirmada sin invalidar
const vigente = (tabla, idcol, id, grupo) =>
  num(`select count(*) n from ${tabla} where ${idcol}=$1 and grupo::text=$2 and invalidada_en is null and resultado='confirmado'`, [id, grupo]);
const enProy = (tipo, id, grupo) =>
  num(`select count(*) n from verificacion_publica where entidad_tipo=$1 and entidad_id=$2 and grupo=$3`, [tipo, id, grupo]);

// (re)inserta una verificación confirmada del grupo → repuebla la proyección vía trigger
const verifTramite = (id, g) => db.query(`insert into tramite_verificaciones(tramite_id,grupo,resultado,verificado_por) values ($1,$2,'confirmado',$3)`, [id, g, U]);
const verifDep     = (id, g) => db.query(`insert into dependencia_verificaciones(dependencia_id,grupo,resultado,verificado_por) values ($1,$2,'confirmado',$3)`, [id, g, U]);

// ------------------------------------------------------------
// Entorno Supabase + migraciones 0002 y 0003
// ------------------------------------------------------------
await db.exec(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key);
  create role anon;
  create role authenticated;
  create role service_role;
  create table public.admin_usuarios (id uuid primary key references auth.users(id), nombre text not null, email text not null unique, rol text not null check (rol in ('editor','admin')), activo boolean not null default true, creado_at timestamptz not null default now());
`);
try {
  await db.exec(readFileSync('supabase/migrations/0002_modelo_contenido.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/0003_triggers_invalidacion.sql', 'utf8'));
  check('migraciones 0002 + 0003 aplican sin errores', true);
} catch (e) { check('migraciones aplican', false, e.message); process.exit(1); }

// ------------------------------------------------------------
// Semilla
// ------------------------------------------------------------
await db.exec(`insert into auth.users(id) values ('${U}'); insert into admin_usuarios(id,nombre,email,rol) values ('${U}','T','t@t.mx','admin');`);
const dep1 = (await uno(`insert into dependencias(slug,nombre,estado) values ('d1','Dep 1','publicado') returning id`)).id;
const dep2 = (await uno(`insert into dependencias(slug,nombre,estado) values ('d2','Dep 2','publicado') returning id`)).id;
await db.query(`insert into dependencia_telefonos(dependencia_id,numero) values ($1,'111')`, [dep1]);
await db.query(`insert into dependencia_horarios(dependencia_id,dia_semana,abre,cierra) values ($1,1,'09:00','15:00')`, [dep1]);
const trA = (await uno(`insert into tramites(slug,nombre,dependencia_id,estado,cta_estado) values ('a','Trámite A',$1,'publicado','oculto') returning id`, [dep1])).id;
const trB = (await uno(`insert into tramites(slug,nombre,dependencia_id,estado) values ('b','Trámite B',$1,'publicado') returning id`, [dep1])).id;
await db.query(`insert into tramite_horarios(tramite_id,dia_semana,abre,cierra) values ($1,1,'10:00','14:00')`, [trB]); // trB tiene horarios propios
await db.query(`insert into representacion_tramite(tramite_id) values ($1)`, [trA]);

// Verificaciones iniciales (disparan la proyección)
for (const g of ['contacto','ubicacion','horarios']) await verifDep(dep1, g);
for (const g of ['requisitos','costos','contacto','ubicacion','representacion']) await verifTramite(trA, g);
await verifTramite(trB, 'horarios_propios');

// ------------------------------------------------------------
// B) Proyección poblada
// ------------------------------------------------------------
check('B: proyección poblada al verificar (dep1=3, trA=5, trB=1)',
  (await num(`select count(*) n from verificacion_publica`)) === 9);

// ------------------------------------------------------------
// TD-1 (directo): editar requisitos → invalida 'requisitos' del trámite + sale de proyección
// ------------------------------------------------------------
await db.query(`update tramites set requisitos='{"x":1}' where id=$1`, [trA]);
check('TD-1 editar requisitos invalida el grupo requisitos',
  (await vigente('tramite_verificaciones', 'tramite_id', trA, 'requisitos')) === 0 && (await enProy('tramite', trA, 'requisitos')) === 0);

// ------------------------------------------------------------
// TI-1: editar teléfono de dependencia → 'contacto' de la dependencia Y del trámite (cascada)
// ------------------------------------------------------------
await db.query(`update dependencia_telefonos set numero='222' where dependencia_id=$1`, [dep1]);
check('TI-1 teléfono de dependencia invalida contacto en dependencia y en el trámite (cascada)',
  (await vigente('dependencia_verificaciones', 'dependencia_id', dep1, 'contacto')) === 0 &&
  (await vigente('tramite_verificaciones', 'tramite_id', trA, 'contacto')) === 0 &&
  (await enProy('dependencia', dep1, 'contacto')) === 0 && (await enProy('tramite', trA, 'contacto')) === 0);

// ------------------------------------------------------------
// TI-2: editar horarios de dependencia → 'horarios' dep; trB con horarios_propios NO se afecta
// ------------------------------------------------------------
await db.query(`update dependencia_horarios set cierra='16:00' where dependencia_id=$1`, [dep1]);
check('TI-2 horarios de dependencia invalidan solo el grupo horarios de la dependencia',
  (await vigente('dependencia_verificaciones', 'dependencia_id', dep1, 'horarios')) === 0);
check('TI-2 el trámite con horarios_propios NO se ve afectado',
  (await vigente('tramite_verificaciones', 'tramite_id', trB, 'horarios_propios')) === 1 && (await enProy('tramite', trB, 'horarios_propios')) === 1);

// ------------------------------------------------------------
// TI-3: editar dirección de dependencia → 'ubicacion' dep + trámite
// ------------------------------------------------------------
await db.query(`update dependencias set direccion='Calle Nueva 5' where id=$1`, [dep1]);
check('TI-3 dirección de dependencia invalida ubicacion en dependencia y trámite',
  (await vigente('dependencia_verificaciones', 'dependencia_id', dep1, 'ubicacion')) === 0 &&
  (await vigente('tramite_verificaciones', 'tramite_id', trA, 'ubicacion')) === 0);

// ------------------------------------------------------------
// TI-4: re-vincular el trámite a otra dependencia → 'contacto' y 'ubicacion' del trámite
// ------------------------------------------------------------
await verifTramite(trA, 'contacto'); await verifTramite(trA, 'ubicacion');  // re-verificar antes
await db.query(`update tramites set dependencia_id=$1 where id=$2`, [dep2, trA]);
check('TI-4 re-vincular dependencia invalida contacto y ubicacion del trámite',
  (await vigente('tramite_verificaciones', 'tramite_id', trA, 'contacto')) === 0 &&
  (await vigente('tramite_verificaciones', 'tramite_id', trA, 'ubicacion')) === 0);

// ------------------------------------------------------------
// TI-5: costo honorario → invalida 'costos' + baja el CTA a revisión
// ------------------------------------------------------------
await db.query(`update tramites set cta_estado='activo' where id=$1`, [trA]);
const hon = (await uno(`insert into costos_tramite(tramite_id,concepto,categoria,tipo) values ($1,'Honorario','honorario','fijo') returning id`, [trA])).id;
await verifTramite(trA, 'costos');  // dejar 'costos' vigente antes del cambio
await db.query(`update costos_tramite set importe_min=500 where id=$1`, [hon]);
check('TI-5 cambio de honorario invalida costos',
  (await vigente('tramite_verificaciones', 'tramite_id', trA, 'costos')) === 0);
check('TI-5 cambio de honorario baja el CTA de activo a proximamente',
  (await uno(`select cta_estado from tramites where id=$1`, [trA])).cta_estado === 'proximamente');

// ------------------------------------------------------------
// TI-6: cambiar representación → invalida 'representacion' + baja CTA; NO toca grupos editoriales
// ------------------------------------------------------------
await db.query(`update tramites set cta_estado='activo' where id=$1`, [trA]);
await verifTramite(trA, 'representacion'); await verifTramite(trA, 'requisitos');  // dejar ambos vigentes
await db.query(`update representacion_tramite set version=2 where tramite_id=$1`, [trA]);
check('TI-6 cambiar representación invalida representacion y baja el CTA',
  (await vigente('tramite_verificaciones', 'tramite_id', trA, 'representacion')) === 0 &&
  (await uno(`select cta_estado from tramites where id=$1`, [trA])).cta_estado === 'proximamente');
check('TI-6 (B8) cambiar representación NO invalida el grupo editorial requisitos',
  (await vigente('tramite_verificaciones', 'tramite_id', trA, 'requisitos')) === 1);

await db.close();
console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLO(S)'} — triggers 0003`);
process.exit(fallos ? 1 : 0);
