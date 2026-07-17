import { supabase } from '../../lib/supabase';
import FichaShell from '../../components/FichaShell';
import Buscador from '../../components/Buscador';

export const revalidate = 3600;

export const metadata = {
  title: 'Dependencias de San Juan del Río',
  description: 'Teléfonos, horarios y ubicación de las dependencias públicas de San Juan del Río, Querétaro.',
  alternates: { canonical: '/dependencias' },
};

export default async function DependenciasIndex() {
  const { data: deps = [] } = await supabase
    .from('dependencias').select('slug, nombre, descripcion').eq('estado', 'publicado').order('nombre');

  return (
    <FichaShell>
      <div className="wrap ficha">
        <h1 className="ficha-h1">Dependencias</h1>
        <p className="ficha-resumen">Teléfonos, horarios y ubicación de las dependencias de San Juan del Río.</p>
        <Buscador placeholder="Busca una dependencia o trámite…" />
        {deps.length === 0 ? (
          <p className="ficha-vacio">Aún no hay dependencias publicadas. Muy pronto.</p>
        ) : (
          <ul className="ficha-indice">
            {deps.map((d) => (
              <li key={d.slug}>
                <a href={`/dependencias/${d.slug}`}>
                  <b>{d.nombre}</b>
                  {d.descripcion && <span>{d.descripcion}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FichaShell>
  );
}
