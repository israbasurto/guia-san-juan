// Prueba de regresión RLS-1 / RLS-2 (PLAN.md §2.2 M18) contra el Supabase REAL.
// Siembra con service role, verifica con la ANON key (RLS activa), y limpia.
//   RLS-1: el anónimo NO lee tablas privadas ni entidades/hijas en borrador.
//   RLS-2: el anónimo lee verificacion_publica SOLO de entidades publicadas.
//
// Uso:  node scripts/probar-rls.mjs   (o: pnpm probar-rls)
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';

if (existsSync('.env.local')) {
  for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
    const i = l.indexOf('='); if (i === -1 || l.trimStart().startsWith('#')) continue;
    const k = l.slice(0, i).trim(); if (!(k in process.env)) process.env[k] = l.slice(i + 1).trim();
  }
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const U = '9b83173d-fecf-4482-9ff8-da2d4b5d22d2';

let fallos = 0;
const check = (n, ok, d = '') => { if (!ok) fallos++; console.log(`${ok ? 'PASA ' : 'FALLA'} ${n}${d ? '  — ' + d : ''}`); };
// "denegado" para el anónimo = error de permiso O cero filas (aunque el dato exista sembrado)
const denegado = async (tabla, filtro) => {
  let q = anon.from(tabla).select('*'); if (filtro) q = filtro(q);
  const { data, error } = await q;
  return !!error || (data?.length ?? 0) === 0;
};

const sfx = Date.now();
let depPub, depBor, trPub, trBor;
try {
  // Publicado
  depPub = (await svc.from('dependencias').insert({ slug: 'rls-dp-' + sfx, nombre: 'RLS Dep Pub', estado: 'publicado' }).select('id').single()).data;
  await svc.from('dependencia_telefonos').insert({ dependencia_id: depPub.id, numero: '111' });
  trPub = (await svc.from('tramites').insert({ slug: 'rls-tp-' + sfx, nombre: 'RLS Tram Pub', dependencia_id: depPub.id, estado: 'publicado' }).select('id').single()).data;
  await svc.from('costos_tramite').insert({ tramite_id: trPub.id, concepto: 'Derecho', categoria: 'derecho', tipo: 'fijo', importe_min: 50 });
  const fuente = (await svc.from('fuentes').insert({ tipo: 'web', descripcion: 'privada' }).select('id').single()).data;
  const verP = (await svc.from('tramite_verificaciones').insert({ tramite_id: trPub.id, grupo: 'requisitos', resultado: 'confirmado', verificado_por: U, fuente_id: fuente.id }).select('id').single()).data;
  await svc.from('tramite_evidencias').insert({ verificacion_id: verP.id, tipo: 'captura' });
  await svc.from('representacion_tramite').insert({ tramite_id: trPub.id });
  await svc.from('busquedas_sin_resultado').insert({ consulta_normalizada: 'rls prueba ' + sfx });

  // Borrador (con verificación → deja fila en la proyección para el borrador)
  depBor = (await svc.from('dependencias').insert({ slug: 'rls-db-' + sfx, nombre: 'RLS Dep Bor', estado: 'borrador' }).select('id').single()).data;
  await svc.from('dependencia_telefonos').insert({ dependencia_id: depBor.id, numero: '999' });
  trBor = (await svc.from('tramites').insert({ slug: 'rls-tb-' + sfx, nombre: 'RLS Tram Bor', estado: 'borrador' }).select('id').single()).data;
  await svc.from('costos_tramite').insert({ tramite_id: trBor.id, concepto: 'Derecho', categoria: 'derecho', tipo: 'fijo', importe_min: 70 });
  await svc.from('tramite_verificaciones').insert({ tramite_id: trBor.id, grupo: 'costos', resultado: 'confirmado', verificado_por: U });

  // ---------- RLS-1: tablas privadas ----------
  for (const t of ['fuentes', 'tramite_verificaciones', 'tramite_evidencias', 'dependencia_verificaciones', 'representacion_tramite', 'busquedas_sin_resultado', 'tramite_fuentes', 'tramite_historial', 'tramite_reportes']) {
    check(`RLS-1 anon no lee ${t}`, await denegado(t));
  }

  // ---------- RLS-1: entidades y hijas en borrador ----------
  check('RLS-1 anon no ve la dependencia en borrador', await denegado('dependencias', (q) => q.eq('id', depBor.id)));
  check('RLS-1 anon no ve el trámite en borrador', await denegado('tramites', (q) => q.eq('id', trBor.id)));
  check('RLS-1 anon no ve teléfonos de dependencia en borrador', await denegado('dependencia_telefonos', (q) => q.eq('dependencia_id', depBor.id)));
  check('RLS-1 anon no ve costos de trámite en borrador', await denegado('costos_tramite', (q) => q.eq('tramite_id', trBor.id)));

  // ---------- RLS-2: proyección pública ----------
  const { data: proyPub } = await anon.from('verificacion_publica').select('*').eq('entidad_id', trPub.id);
  check('RLS-2 anon SÍ ve la proyección del publicado', (proyPub?.length ?? 0) >= 1);
  check('RLS-2 anon NO ve la proyección del borrador', await denegado('verificacion_publica', (q) => q.eq('entidad_id', trBor.id)));
  // la proyección no expone columnas privadas
  check('RLS-2 la proyección solo trae columnas seguras', proyPub?.length ? Object.keys(proyPub[0]).every((k) => ['entidad_tipo', 'entidad_id', 'grupo', 'fecha'].includes(k)) : true);

  // ---------- Controles positivos ----------
  check('positivo: anon SÍ ve la dependencia publicada', !(await denegado('dependencias', (q) => q.eq('id', depPub.id))));
  check('positivo: anon SÍ ve los costos del trámite publicado', !(await denegado('costos_tramite', (q) => q.eq('tramite_id', trPub.id))));
} finally {
  if (trPub) await svc.from('tramites').delete().eq('id', trPub.id);
  if (trBor) await svc.from('tramites').delete().eq('id', trBor.id);
  if (depPub) await svc.from('dependencias').delete().eq('id', depPub.id);
  if (depBor) await svc.from('dependencias').delete().eq('id', depBor.id);
  await svc.from('busquedas_sin_resultado').delete().eq('consulta_normalizada', 'rls prueba ' + sfx);
  console.log('limpieza hecha');
}
console.log(`\n${fallos === 0 ? 'TODO VERDE' : fallos + ' FALLO(S)'} — RLS-1 / RLS-2 (Supabase real)`);
process.exit(fallos ? 1 : 0);
