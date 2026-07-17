import { ImageResponse } from 'next/og';
import { supabase } from '../../../lib/supabase';
import { ogCard } from '../../../lib/og-card';

export const alt = 'Guía San Juan — Guía';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { slug } = await params;
  const { data } = await supabase.from('guias').select('titulo').eq('slug', slug).eq('estado', 'publicado').maybeSingle();
  return new ImageResponse(ogCard({ tag: 'Guía', titulo: data?.titulo || 'Guía San Juan' }), { ...size });
}
