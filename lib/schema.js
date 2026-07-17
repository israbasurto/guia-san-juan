// Generadores de JSON-LD desde filas de Supabase (PLAN.md §3.1).
// Uso semántico, no como promesa de rich results.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guiasanjuan.mx';

export function breadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function tramiteSchema(tramite, dependencia) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: tramite.nombre,
    description: tramite.resumen || undefined,
    url: `${SITE_URL}/tramites/${tramite.slug}`,
    inLanguage: 'es-MX',
    areaServed: { '@type': 'City', name: 'San Juan del Río' },
  };
  if (dependencia) {
    schema.serviceOperator = {
      '@type': 'GovernmentOffice',
      name: dependencia.nombre,
      url: `${SITE_URL}/dependencias/${dependencia.slug}`,
    };
  }
  return schema;
}

export function guiaSchema(guia) {
  // Article semántico (§3.1: HowTo solo semántico, sin venderlo como rich result).
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guia.titulo,
    description: guia.resumen || undefined,
    url: `${SITE_URL}/guias/${guia.slug}`,
    inLanguage: 'es-MX',
    datePublished: guia.publicado_en || undefined,
    dateModified: guia.actualizado_en || undefined,
    author: { '@type': 'Organization', name: 'Guía San Juan' },
  };
}

export function dependenciaSchema(dep, telefonos = []) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOffice',
    name: dep.nombre,
    description: dep.descripcion || undefined,
    url: `${SITE_URL}/dependencias/${dep.slug}`,
    inLanguage: 'es-MX',
  };
  if (dep.direccion) {
    schema.address = { '@type': 'PostalAddress', streetAddress: dep.direccion, addressLocality: 'San Juan del Río', addressRegion: 'Querétaro', addressCountry: 'MX' };
  }
  if (dep.lat != null && dep.lng != null) {
    schema.geo = { '@type': 'GeoCoordinates', latitude: dep.lat, longitude: dep.lng };
  }
  const tel = telefonos.find((t) => t.numero);
  if (tel) schema.telephone = tel.numero;
  return schema;
}
