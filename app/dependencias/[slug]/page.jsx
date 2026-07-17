import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import FichaShell from '../../../components/FichaShell';
import DisclaimerOficial from '../../../components/DisclaimerOficial';
import { DIAS, GRUPO_LABEL, fechaLarga, frescura } from '../../../lib/contenido';
import { dependenciaSchema, breadcrumbList } from '../../../lib/schema';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { data } = await supabase.from('dependencias').select('slug').eq('estado', 'publicado');
  return (data ?? []).map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: d } = await supabase.from('dependencias').select('nombre, descripcion').eq('slug', slug).eq('estado', 'publicado').maybeSingle();
  if (!d) return { title: 'Dependencia no encontrada' };
  return {
    title: d.nombre,
    description: d.descripcion || `${d.nombre} en San Juan del Río: teléfonos, horarios, ubicación y trámites que gestiona.`,
    alternates: { canonical: `/dependencias/${slug}` },
  };
}

export default async function DependenciaPage({ params }) {
  const { slug } = await params;
  const { data: dep } = await supabase.from('dependencias').select('*').eq('slug', slug).eq('estado', 'publicado').maybeSingle();
  if (!dep) notFound();

  const [telefonos, horarios, excepciones, verif, tramites] = await Promise.all([
    supabase.from('dependencia_telefonos').select('*').eq('dependencia_id', dep.id).then((r) => r.data ?? []),
    supabase.from('dependencia_horarios').select('*').eq('dependencia_id', dep.id).order('dia_semana').then((r) => r.data ?? []),
    supabase.from('dependencia_horarios_excepciones').select('*').eq('dependencia_id', dep.id).order('fecha').then((r) => r.data ?? []),
    supabase.from('verificacion_publica').select('grupo, fecha').eq('entidad_tipo', 'dependencia').eq('entidad_id', dep.id).then((r) => r.data ?? []),
    supabase.from('tramites').select('slug, nombre').eq('dependencia_id', dep.id).eq('estado', 'publicado').order('nombre').then((r) => r.data ?? []),
  ]);

  const fresca = frescura(verif);
  const mapsUrl = dep.lat != null && dep.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${dep.lat},${dep.lng}`
    : dep.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dep.direccion + ', San Juan del Río, Querétaro')}` : null;
  const hoy = new Date().toISOString().slice(0, 10);
  const excepFuturas = excepciones.filter((e) => e.fecha >= hoy);

  const jsonLd = [
    dependenciaSchema(dep, telefonos),
    breadcrumbList([{ name: 'Inicio', path: '/' }, { name: 'Dependencias', path: '/dependencias' }, { name: dep.nombre, path: `/dependencias/${dep.slug}` }]),
  ];

  return (
    <FichaShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="wrap ficha">
        <nav className="ficha-crumbs" aria-label="Ruta">
          <a href="/">Inicio</a> › <a href="/dependencias">Dependencias</a> › <span>{dep.nombre}</span>
        </nav>

        <h1 className="ficha-h1">{dep.nombre}</h1>
        {dep.descripcion && <p className="ficha-resumen">{dep.descripcion}</p>}

        <DisclaimerOficial dependencia={dep.nombre} />

        {fresca && (
          <div className="ficha-frescura">
            <span className="ficha-frescura-main">🛈 {fresca.etiqueta}</span>
            <div className="ficha-frescura-chips">
              {Object.entries(fresca.porGrupo).map(([g, f]) => (
                <span key={g} className="ficha-chip">{GRUPO_LABEL[g] || g}: {fechaLarga(f)}</span>
              ))}
            </div>
            {fresca.vencido && (
              <p className="ficha-frescura-aviso">
                ⚠ Parte de esta información tiene más de 90 días. Confírmala por teléfono antes de acudir.
              </p>
            )}
          </div>
        )}

        {telefonos.filter((t) => t.numero).length > 0 && (
          <section className="ficha-sec">
            <h2>Teléfonos</h2>
            <div className="ficha-acciones">
              {telefonos.filter((t) => t.numero).map((t) => (
                <a key={t.id} className="btn btn--primary" href={`tel:${t.numero.replace(/[^0-9+]/g, '')}`}>
                  {t.etiqueta ? `${t.etiqueta}: ` : ''}{t.numero}{t.extension ? ` ext. ${t.extension}` : ''}
                </a>
              ))}
            </div>
          </section>
        )}

        {horarios.length > 0 && (
          <section className="ficha-sec">
            <h2>Horarios</h2>
            <table className="ficha-horarios">
              <tbody>
                {horarios.map((h, i) => (
                  <tr key={i}><td>{DIAS[h.dia_semana]}</td><td>{h.abre?.slice(0, 5)}–{h.cierra?.slice(0, 5)}</td></tr>
                ))}
              </tbody>
            </table>
            {excepFuturas.length > 0 && (
              <div className="ficha-excep">
                <b>Días especiales:</b>
                <ul>
                  {excepFuturas.map((e) => (
                    <li key={e.id}>{fechaLarga(e.fecha)}: {e.cerrado ? 'Cerrado' : `${e.abre?.slice(0, 5)}–${e.cierra?.slice(0, 5)}`}{e.motivo ? ` (${e.motivo})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {(dep.direccion || mapsUrl) && (
          <section className="ficha-sec">
            <h2>Ubicación</h2>
            {dep.direccion && <p>{dep.direccion}</p>}
            {mapsUrl && <a className="btn btn--ghost" href={mapsUrl} target="_blank" rel="noopener noreferrer">Cómo llegar</a>}
          </section>
        )}

        {tramites.length > 0 && (
          <section className="ficha-sec">
            <h2>Trámites que gestiona</h2>
            <ul className="ficha-tramites-lista">
              {tramites.map((t) => <li key={t.slug}><a href={`/tramites/${t.slug}`}>{t.nombre} →</a></li>)}
            </ul>
          </section>
        )}
      </article>
    </FichaShell>
  );
}
