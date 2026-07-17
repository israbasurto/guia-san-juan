import { supabase } from '../lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guiasanjuan.mx';

export const revalidate = 3600;

export default async function sitemap() {
  const base = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/tramites`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/dependencias`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/#proyecto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const [{ data: tramites = [] }, { data: deps = [] }] = await Promise.all([
    supabase.from('tramites').select('slug, actualizado_en').eq('estado', 'publicado'),
    supabase.from('dependencias').select('slug, actualizado_en').eq('estado', 'publicado'),
  ]);

  const fichas = [
    ...tramites.map((t) => ({ url: `${SITE_URL}/tramites/${t.slug}`, lastModified: new Date(t.actualizado_en || Date.now()), changeFrequency: 'monthly', priority: 0.9 })),
    ...deps.map((d) => ({ url: `${SITE_URL}/dependencias/${d.slug}`, lastModified: new Date(d.actualizado_en || Date.now()), changeFrequency: 'monthly', priority: 0.7 })),
  ];

  return [...base, ...fichas];
}
