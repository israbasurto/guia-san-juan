// Helpers de presentación del contenido público.
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const GRUPO_LABEL = {
  requisitos: 'Requisitos', costos: 'Costos', contacto: 'Contacto',
  ubicacion: 'Ubicación', horarios_propios: 'Horarios', horarios: 'Horarios', representacion: 'Representación',
};

export function fechaLarga(iso) {
  if (!iso) return '';
  // Fecha sin hora (YYYY-MM-DD): construir en horario local para no correrla por zona.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}

// M24: rango honesto de antigüedad por sección, sin comunicar precisión engañosa.
export function frescura(rows) {
  if (!rows?.length) return null;
  const fechas = [...rows.map((r) => r.fecha)].sort();
  const min = fechas[0], max = fechas[fechas.length - 1];
  const porGrupo = {};
  for (const r of rows) porGrupo[r.grupo] = r.fecha; // proyección ya trae la vigente
  return {
    min, max, unaSola: min === max,
    porGrupo,
    // etiqueta principal
    etiqueta: min === max
      ? `Verificación crítica más antigua: ${fechaLarga(min)}`
      : `Información crítica verificada entre el ${fechaLarga(min)} y el ${fechaLarga(max)}`,
  };
}

export function importeTexto(c) {
  const f = (n) => `$${Number(n).toLocaleString('es-MX')}`;
  if (c.tipo === 'desconocido' || (c.importe_min == null && c.importe_max == null)) return 'Por confirmar';
  if (c.tipo === 'desde') return `Desde ${f(c.importe_min ?? c.importe_max)}`;
  if (c.importe_max != null && c.importe_max !== c.importe_min) return `${f(c.importe_min ?? 0)} – ${f(c.importe_max)}`;
  return f(c.importe_min ?? c.importe_max);
}
