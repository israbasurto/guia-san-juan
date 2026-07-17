import { supabase } from '../../lib/supabase';
import FichaShell from '../../components/FichaShell';

export const revalidate = 3600;

export const metadata = {
  title: 'Guías de trámites de San Juan del Río',
  description: 'Guías paso a paso para hacer tus trámites en San Juan del Río, Querétaro.',
  alternates: { canonical: '/guias' },
};

export default async function GuiasIndex() {
  const { data: guias = [] } = await supabase
    .from('guias').select('slug, titulo, resumen').eq('estado', 'publicado').order('publicado_en', { ascending: false });

  return (
    <FichaShell>
      <div className="wrap ficha">
        <h1 className="ficha-h1">Guías</h1>
        <p className="ficha-resumen">Explicaciones paso a paso para resolver tus trámites en San Juan del Río.</p>
        {guias.length === 0 ? (
          <p className="ficha-vacio">Aún no hay guías publicadas. Muy pronto.</p>
        ) : (
          <ul className="ficha-indice">
            {guias.map((g) => (
              <li key={g.slug}>
                <a href={`/guias/${g.slug}`}>
                  <b>{g.titulo}</b>
                  {g.resumen && <span>{g.resumen}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FichaShell>
  );
}
