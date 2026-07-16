// Respaldo del contenido (datos) del proyecto Supabase — TRI-216 / PLAN.md §5.2.
// El ESQUEMA vive versionado en supabase/migrations/*.sql; este script respalda los DATOS.
// Sin dependencias nuevas: usa la service role vía PostgREST (omite RLS).
//
// Uso:  node scripts/respaldo.mjs
// Salida: respaldos/<timestamp>/<tabla>.json + manifest.json (con conteos y sha256).
// respaldos/ está en .gitignore (los datos incluyen personales, p. ej. emails de propuestas).
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

// Carga .env.local a process.env (sin dependencias):
import { readFileSync } from 'node:fs';
if (existsSync('.env.local')) {
  for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
    const i = l.indexOf('=');
    if (i === -1 || l.trimStart().startsWith('#')) continue;
    const k = l.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = l.slice(i + 1).trim();
  }
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(URL, SERVICE, { auth: { persistSession: false } });
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// Descubre las tablas públicas expuestas por PostgREST (refleja el estado real del esquema).
async function descubrirTablas() {
  const r = await fetch(URL + '/rest/v1/', {
    headers: { apikey: SERVICE, authorization: 'Bearer ' + SERVICE },
  });
  const spec = await r.json();
  return Object.keys(spec.definitions || {}).sort();
}

async function exportarTabla(tabla) {
  const filas = [];
  const paso = 1000;
  for (let desde = 0; ; desde += paso) {
    const { data, error } = await supabase.from(tabla).select('*').range(desde, desde + paso - 1);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    filas.push(...data);
    if (data.length < paso) break;
  }
  return filas;
}

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const dir = `respaldos/${ts}`;
mkdirSync(dir, { recursive: true });

const tablas = await descubrirTablas();
const manifest = { timestamp: new Date().toISOString(), origen: URL, tablas: [] };

for (const tabla of tablas) {
  const filas = await exportarTabla(tabla);
  // Orden estable por si acaso, para un hash reproducible
  const json = JSON.stringify(filas, null, 2);
  writeFileSync(`${dir}/${tabla}.json`, json);
  const hash = sha256(JSON.stringify(filas));
  manifest.tablas.push({ nombre: tabla, filas: filas.length, sha256: hash });
  console.log(`  ${tabla}: ${filas.length} filas`);
}

writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`\nRespaldo escrito en ${dir}/ (${tablas.length} tablas)`);
