// Búsqueda tolerante a acentos y errores de escritura (§4). Pura y testeable.
export const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Distancia de edición (Levenshtein).
export function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

// Puntúa un texto contra los tokens de la consulta. Cada token debe aparecer
// (substring o aproximado por edición); si alguno falta, devuelve -1 (descartar).
export function puntuar(tokens, hay) {
  const words = hay.split(/\s+/);
  let score = 0;
  for (const tok of tokens) {
    if (hay.includes(tok)) { score += tok.length + 2; continue; }
    if (tok.length >= 4) {
      let best = 99;
      for (const w of words) best = Math.min(best, lev(tok, w));
      const umbral = tok.length >= 7 ? 2 : 1;
      if (best <= umbral) { score += 1; continue; }
    }
    return -1;
  }
  return score;
}

// Busca en el índice. Cada item: { nombre, detalle, tipo, url }.
export function buscar(indice, consulta, limite = 8) {
  const q = norm(consulta).trim();
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  if (!tokens.length || !indice) return [];
  return indice
    .map((it) => ({ it, score: puntuar(tokens, norm(`${it.nombre} ${it.detalle} ${it.tipo}`)) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map((r) => r.it);
}
