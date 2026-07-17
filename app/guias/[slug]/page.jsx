import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import FichaShell from '../../../components/FichaShell';
import DisclaimerOficial from '../../../components/DisclaimerOficial';
import Markdown from '../../../components/Markdown';
import { fechaLarga } from '../../../lib/contenido';
import { guiaSchema, breadcrumbList } from '../../../lib/schema';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { data } = await supabase.from('guias').select('slug').eq('estado', 'publicado');
  return (data ?? []).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: g } = await supabase.from('guias').select('titulo, resumen').eq('slug', slug).eq('estado', 'publicado').maybeSingle();
  if (!g) return { title: 'Guía no encontrada' };
  return {
    title: g.titulo,
    description: g.resumen || `${g.titulo} — guía para San Juan del Río.`,
    alternates: { canonical: `/guias/${slug}` },
  };
}

export default async function GuiaPage({ params }) {
  const { slug } = await params;
  const { data: guia } = await supabase.from('guias').select('*').eq('slug', slug).eq('estado', 'publicado').maybeSingle();
  if (!guia) notFound();

  // Trámites vinculados (solo publicados)
  const { data: vinc = [] } = await supabase.from('guias_tramites').select('tramite_id').eq('guia_id', guia.id);
  let tramites = [];
  if (vinc.length) {
    const { data = [] } = await supabase.from('tramites').select('slug, nombre').eq('estado', 'publicado').in('id', vinc.map((v) => v.tramite_id));
    tramites = data;
  }

  const jsonLd = [
    guiaSchema(guia),
    breadcrumbList([{ name: 'Inicio', path: '/' }, { name: 'Guías', path: '/guias' }, { name: guia.titulo, path: `/guias/${guia.slug}` }]),
  ];

  return (
    <FichaShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="wrap ficha">
        <nav className="ficha-crumbs" aria-label="Ruta">
          <a href="/">Inicio</a> › <a href="/guias">Guías</a> › <span>{guia.titulo}</span>
        </nav>

        <h1 className="ficha-h1">{guia.titulo}</h1>
        {guia.resumen && <p className="ficha-resumen">{guia.resumen}</p>}
        {guia.publicado_en && <p className="admin-muted" style={{ fontSize: 14 }}>Publicada el {fechaLarga(guia.publicado_en)}</p>}

        <DisclaimerOficial />

        {guia.contenido_md && (
          <section className="ficha-sec guia-contenido">
            <Markdown>{guia.contenido_md}</Markdown>
          </section>
        )}

        {tramites.length > 0 && (
          <section className="ficha-sec">
            <h2>Trámites relacionados</h2>
            <ul className="ficha-tramites-lista">
              {tramites.map((t) => <li key={t.slug}><a href={`/tramites/${t.slug}`}>{t.nombre} →</a></li>)}
            </ul>
          </section>
        )}
      </article>
    </FichaShell>
  );
}
