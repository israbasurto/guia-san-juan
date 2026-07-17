import { supabase } from '../../lib/supabase';

// Índice JSON de fichas publicadas para el buscador client-side (§4).
// Cacheado (ISR): pocos cientos de registros, se sirve estático entre revalidaciones.
export const revalidate = 3600;

export async function GET() {
  const [{ data: tramites = [] }, { data: deps = [] }] = await Promise.all([
    supabase.from('tramites').select('slug, nombre, resumen').eq('estado', 'publicado'),
    supabase.from('dependencias').select('slug, nombre, descripcion').eq('estado', 'publicado'),
  ]);

  const items = [
    ...tramites.map((t) => ({ tipo: 'tramite', nombre: t.nombre, detalle: t.resumen || '', url: `/tramites/${t.slug}` })),
    ...deps.map((d) => ({ tipo: 'dependencia', nombre: d.nombre, detalle: d.descripcion || '', url: `/dependencias/${d.slug}` })),
  ];

  return Response.json({ items }, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600' } });
}
