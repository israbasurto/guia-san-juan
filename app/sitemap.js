import { supabase } from '../lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guiasanjuan.mx';

export const revalidate = 3600;

export default async function sitemap() {
  const base = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/tramites`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/dependencias`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/directorio`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/guias`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/#proyecto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const [{ data: tramites = [] }, { data: deps = [] }, { data: guias = [] }] = await Promise.all([
    supabase.from('tramites').select('slug, actualizado_en').eq('estado', 'publicado'),
    supabase.from('dependencias').select('slug, actualizado_en').eq('estado', 'publicado'),
    supabase.from('guias').select('slug, actualizado_en').eq('estado', 'publicado'),
  ]);

  const fichas = [
    ...tramites.map((t) => ({ url: `${SITE_URL}/tramites/${t.slug}`, lastModified: new Date(t.actualizado_en || Date.now()), changeFrequency: 'monthly', priority: 0.9 })),
    ...deps.map((d) => ({ url: `${SITE_URL}/dependencias/${d.slug}`, lastModified: new Date(d.actualizado_en || Date.now()), changeFrequency: 'monthly', priority: 0.7 })),
    ...guias.map((g) => ({ url: `${SITE_URL}/guias/${g.slug}`, lastModified: new Date(g.actualizado_en || Date.now()), changeFrequency: 'monthly', priority: 0.6 })),
  ];

  return [...base, ...fichas];
}
