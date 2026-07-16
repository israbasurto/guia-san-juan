// Prueba de restauración (M17-10, PLAN.md §5.1/§5.2): carga un respaldo en un
// Postgres real aislado (PGlite, en proceso — sin Docker) y verifica que cada
// fila vuelve íntegra tras el round-trip. "Restauración probada de verdad."
//
// Uso:  node scripts/probar-restauracion.mjs [dir-respaldo]
// Sin argumento, toma el respaldo más reciente de respaldos/.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

function ultimoRespaldo() {
  if (!existsSync('respaldos')) return null;
  const dirs = readdirSync('respaldos').filter((d) => existsSync(`respaldos/${d}/manifest.json`)).sort();
  return dirs.length ? `respaldos/${dirs[dirs.length - 1]}` : null;
}

const dirRespaldo = process.argv[2] || ultimoRespaldo();
if (!dirRespaldo || !existsSync(`${dirRespaldo}/manifest.json`)) {
  console.error('No se encontró un respaldo. Corre primero: node scripts/respaldo.mjs');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(`${dirRespaldo}/manifest.json`, 'utf8'));
console.log(`Respaldo: ${dirRespaldo}  (${manifest.timestamp}, ${manifest.tablas.length} tablas)\n`);

const db = new PGlite();
await db.exec('create schema restauracion;');

// Deep-equal insensible al orden de claves (jsonb reordena claves; los valores no cambian).
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v;
}
const canonStr = (v) => JSON.stringify(canon(v));

let fallos = 0;
for (const t of manifest.tablas) {
  const filasOriginal = JSON.parse(readFileSync(`${dirRespaldo}/${t.nombre}.json`, 'utf8'));

  await db.exec(`create table restauracion."${t.nombre}" (n int, fila jsonb);`);
  for (let i = 0; i < filasOriginal.length; i++) {
    await db.query(`insert into restauracion."${t.nombre}" (n, fila) values ($1, $2)`, [i, JSON.stringify(filasOriginal[i])]);
  }

  const { rows } = await db.query(`select fila from restauracion."${t.nombre}" order by n`);
  const restauradas = rows.map((r) => r.fila);

  const okConteo = restauradas.length === t.filas && restauradas.length === filasOriginal.length;
  let okContenido = true;
  for (let i = 0; i < filasOriginal.length; i++) {
    if (canonStr(filasOriginal[i]) !== canonStr(restauradas[i])) { okContenido = false; break; }
  }

  const paso = okConteo && okContenido;
  if (!paso) fallos++;
  console.log(`${paso ? 'PASA ' : 'FALLA'} ${t.nombre.padEnd(20)} conteo ${restauradas.length}/${t.filas}  contenido ${okContenido ? 'íntegro' : 'DIFIERE'}`);
}

await db.close();
console.log(`\n${manifest.tablas.length - fallos}/${manifest.tablas.length} tablas restauradas y verificadas`);
process.exit(fallos ? 1 : 0);
