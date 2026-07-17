import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import FichaShell from '../../../components/FichaShell';
import DisclaimerOficial from '../../../components/DisclaimerOficial';
import { DIAS, GRUPO_LABEL, fechaLarga, frescura, importeTexto } from '../../../lib/contenido';
import { tramiteSchema, breadcrumbList } from '../../../lib/schema';

export const revalidate = 3600;      // ISR
export const dynamicParams = true;

async function cargar(slug) {
  const { data: tramite } = await supabase.from('tramites').select('*').eq('slug', slug).eq('estado', 'publicado').maybeSingle();
  if (!tramite) return null;

  const [dep, costos, horariosPropios, verif] = await Promise.all([
    tramite.dependencia_id
      ? supabase.from('dependencias').select('*').eq('id', tramite.dependencia_id).maybeSingle().then((r) => r.data)
      : null,
    supabase.from('costos_tramite').select('*').eq('tramite_id', tramite.id).then((r) => r.data ?? []),
    supabase.from('tramite_horarios').select('*').eq('tramite_id', tramite.id).then((r) => r.data ?? []),
    supabase.from('verificacion_publica').select('grupo, fecha').eq('entidad_tipo', 'tramite').eq('entidad_id', tramite.id).then((r) => r.data ?? []),
  ]);

  let telefonos = [], horariosDep = [];
  if (dep) {
    [telefonos, horariosDep] = await Promise.all([
      supabase.from('dependencia_telefonos').select('*').eq('dependencia_id', dep.id).then((r) => r.data ?? []),
      supabase.from('dependencia_horarios').select('*').eq('dependencia_id', dep.id).order('dia_semana').then((r) => r.data ?? []),
    ]);
  }
  return { tramite, dep, costos, horariosPropios, horariosDep, telefonos, verif };
}

export async function generateStaticParams() {
  const { data } = await supabase.from('tramites').select('slug').eq('estado', 'publicado');
  return (data ?? []).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: t } = await supabase.from('tramites').select('nombre, resumen').eq('slug', slug).eq('estado', 'publicado').maybeSingle();
  if (!t) return { title: 'Trámite no encontrado' };
  return {
    title: t.nombre,
    description: t.resumen || `${t.nombre} en San Juan del Río: requisitos, costos, dónde y cómo hacerlo.`,
    alternates: { canonical: `/tramites/${slug}` },
  };
}

export default async function TramitePage({ params }) {
  const { slug } = await params;
  const data = await cargar(slug);
  if (!data) notFound();
  const { tramite, dep, costos, horariosPropios, horariosDep, telefonos, verif } = data;

  const fresca = frescura(verif);
  const ctaActivo = tramite.cta_estado === 'activo';
  // Costos: honorarios solo si el servicio está activo (B8); el resto siempre.
  const costosVisibles = costos.filter((c) => c.categoria !== 'honorario' || ctaActivo);
  const honorario = costos.find((c) => c.categoria === 'honorario');
  const horarios = horariosPropios.length ? horariosPropios : horariosDep;
  const mapsUrl = dep && (dep.lat != null && dep.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${dep.lat},${dep.lng}`
    : dep.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dep.direccion + ', San Juan del Río, Querétaro')}` : null);

  const jsonLd = [
    tramiteSchema(tramite, dep),
    breadcrumbList([{ name: 'Inicio', path: '/' }, { name: 'Trámites', path: '/tramites' }, { name: tramite.nombre, path: `/tramites/${tramite.slug}` }]),
  ];

  const requisitos = Array.isArray(tramite.requisitos) ? tramite.requisitos : [];
  const faqs = Array.isArray(tramite.faqs) ? tramite.faqs : [];
  const waMsg = encodeURIComponent(`Hola, quiero información sobre el trámite: ${tramite.nombre}.`);

  return (
    <FichaShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="wrap ficha">
        <nav className="ficha-crumbs" aria-label="Ruta">
          <a href="/">Inicio</a> › <a href="/tramites">Trámites</a> › <span>{tramite.nombre}</span>
        </nav>

        <h1 className="ficha-h1">{tramite.nombre}</h1>
        {tramite.resumen && <p className="ficha-resumen">{tramite.resumen}</p>}

        <DisclaimerOficial dependencia={dep?.nombre} />

        {fresca && (
          <div className="ficha-frescura">
            <span className="ficha-frescura-main">🛈 {fresca.etiqueta}</span>
            <div className="ficha-frescura-chips">
              {Object.entries(fresca.porGrupo).map(([g, f]) => (
                <span key={g} className="ficha-chip">{GRUPO_LABEL[g] || g}: {fechaLarga(f)}</span>
              ))}
            </div>
          </div>
        )}

        {tramite.descripcion_md && (
          <section className="ficha-sec">
            <h2>¿Qué es y para qué sirve?</h2>
            {tramite.descripcion_md.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
          </section>
        )}

        {requisitos.length > 0 && (
          <section className="ficha-sec">
            <h2>Requisitos</h2>
            <ul className="ficha-checklist">
              {requisitos.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}

        {costosVisibles.length > 0 && (
          <section className="ficha-sec">
            <h2>Costos</h2>
            <table className="ficha-costos">
              <tbody>
                {costosVisibles.map((c) => (
                  <tr key={c.id}>
                    <td>{c.concepto}<span className="ficha-costo-cat"> · {c.categoria}</span></td>
                    <td className="ficha-costo-imp">{importeTexto(c)}{c.vigencia_inicio ? <span className="ficha-costo-vig"> (vig. {fechaLarga(c.vigencia_inicio)})</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {costosVisibles.some((c) => ['rango', 'desde', 'desconocido'].includes(c.tipo)) && (
              <p className="ficha-nota">Los montos con rango son una <b>estimación</b>; confirma el total en la dependencia.</p>
            )}
          </section>
        )}

        {dep && (
          <section className="ficha-sec">
            <h2>Dónde se hace</h2>
            <div className="ficha-dep-card">
              <a className="ficha-dep-nombre" href={`/dependencias/${dep.slug}`}>{dep.nombre} →</a>
              {dep.direccion && <p className="ficha-dep-dir">{dep.direccion}</p>}
              <div className="ficha-acciones">
                {telefonos.filter((t) => t.numero).slice(0, 3).map((t) => (
                  <a key={t.id} className="btn btn--primary" href={`tel:${t.numero.replace(/[^0-9+]/g, '')}`}>
                    Llamar{t.etiqueta ? ` · ${t.etiqueta}` : ''}
                  </a>
                ))}
                {mapsUrl && <a className="btn btn--ghost" href={mapsUrl} target="_blank" rel="noopener noreferrer">Cómo llegar</a>}
              </div>
              {horarios.length > 0 && (
                <table className="ficha-horarios">
                  <tbody>
                    {horarios.map((h, i) => (
                      <tr key={i}><td>{DIAS[h.dia_semana]}</td><td>{h.abre?.slice(0, 5)}–{h.cierra?.slice(0, 5)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* CTA de gestoría — M5 */}
        {tramite.cta_estado === 'proximamente' && (
          <div className="ficha-cta ficha-cta--pronto">
            <b>Muy pronto</b> podrás resolver este trámite con nuestro servicio de gestoría.
          </div>
        )}
        {ctaActivo && (
          <div className="ficha-cta ficha-cta--activo">
            <div>
              <b>¿Prefieres que lo hagamos por ti?</b>
              {honorario && <span className="ficha-cta-precio"> Honorario: {importeTexto(honorario)}</span>}
              <p className="ficha-cta-nota">Documentos nunca por WhatsApp; se suben por un canal seguro.</p>
            </div>
            <a className="btn btn--primary" href={`https://wa.me/524271000100?text=${waMsg}`} target="_blank" rel="noopener noreferrer">
              Solicitar por WhatsApp
            </a>
          </div>
        )}

        {faqs.length > 0 && (
          <section className="ficha-sec">
            <h2>Preguntas frecuentes</h2>
            {faqs.map((f, i) => (
              <details key={i} className="ficha-faq">
                <summary>{f.q || f.pregunta}</summary>
                <p>{f.a || f.respuesta}</p>
              </details>
            ))}
          </section>
        )}
      </article>
    </FichaShell>
  );
}
