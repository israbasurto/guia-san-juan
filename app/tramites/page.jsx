import { supabase } from '../../lib/supabase';
import FichaShell from '../../components/FichaShell';

export const revalidate = 3600;

export const metadata = {
  title: 'Trámites en San Juan del Río',
  description: 'Requisitos, costos y dónde hacer tus trámites en San Juan del Río, Querétaro.',
  alternates: { canonical: '/tramites' },
};

export default async function TramitesIndex() {
  const { data: tramites = [] } = await supabase
    .from('tramites').select('slug, nombre, resumen').eq('estado', 'publicado').order('nombre');

  return (
    <FichaShell>
      <div className="wrap ficha">
        <h1 className="ficha-h1">Trámites</h1>
        <p className="ficha-resumen">Requisitos, costos y dónde hacer cada trámite en San Juan del Río.</p>
        {tramites.length === 0 ? (
          <p className="ficha-vacio">Aún no hay trámites publicados. Muy pronto.</p>
        ) : (
          <ul className="ficha-indice">
            {tramites.map((t) => (
              <li key={t.slug}>
                <a href={`/tramites/${t.slug}`}>
                  <b>{t.nombre}</b>
                  {t.resumen && <span>{t.resumen}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FichaShell>
  );
}
