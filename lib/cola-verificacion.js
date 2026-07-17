// Cola de verificación (B4/§3.4): grupos que necesitan atención.
// Fuente: verificacion_publica (fecha vigente por entidad+grupo) + tablas de verificación.
// - vencido:    grupo vigente cuya última verificación supera DIAS_VENCE (90).
// - invalidado: grupo con verificaciones pero AUSENTE de la proyección
//               (invalidado por edición, o última no 'confirmado').
export const DIAS_VENCE = 90;
export const DIAS_AVISO_PUBLICO = 180;

const TABLAS = [
  ['tramite', 'tramite_verificaciones', 'tramite_id'],
  ['dependencia', 'dependencia_verificaciones', 'dependencia_id'],
  ['directorio', 'directorio_verificaciones', 'directorio_id'],
];

const clave = (t, id, g) => `${t}:${id}:${g}`;

export function diasDesde(fecha) {
  if (!fecha) return null;
  const [y, m, d] = fecha.slice(0, 10).split('-').map(Number);
  const ms = Date.now() - new Date(y, m - 1, d).getTime();
  return Math.floor(ms / 86400000);
}

export async function calcularCola(db) {
  const limite = new Date(Date.now() - DIAS_VENCE * 86400000).toISOString().slice(0, 10);

  const { data: proy = [] } = await db.from('verificacion_publica').select('entidad_tipo, entidad_id, grupo, fecha');
  const vigentes = new Set(proy.map((p) => clave(p.entidad_tipo, p.entidad_id, p.grupo)));

  const existentes = new Map();
  for (const [tipo, tabla, idcol] of TABLAS) {
    const { data = [] } = await db.from(tabla).select(`${idcol}, grupo`);
    for (const r of data) existentes.set(clave(tipo, r[idcol], r.grupo), { tipo, id: r[idcol], grupo: r.grupo });
  }

  const vencidos = proy
    .filter((p) => p.fecha < limite)
    .map((p) => ({ tipo: p.entidad_tipo, id: p.entidad_id, grupo: p.grupo, fecha: p.fecha, dias: diasDesde(p.fecha), motivo: 'vencido' }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const invalidados = [...existentes.values()]
    .filter((e) => !vigentes.has(clave(e.tipo, e.id, e.grupo)))
    .map((e) => ({ ...e, fecha: null, dias: null, motivo: 'invalidado' }));

  return { vencidos, invalidados, total: vencidos.length + invalidados.length };
}
