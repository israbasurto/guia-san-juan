import { supabase } from '../../lib/supabase';
import FichaShell from '../../components/FichaShell';
import DirectorioLista from '../../components/DirectorioLista';

export const revalidate = 3600;

export const metadata = {
  title: 'Directorio telefónico de San Juan del Río',
  description: 'Teléfonos de dependencias, servicios y números útiles de San Juan del Río, Querétaro.',
  alternates: { canonical: '/directorio' },
};

export default async function DirectorioIndex() {
  const { data: registros = [] } = await supabase
    .from('directorio').select('id, nombre, categoria, direccion').eq('estado', 'publicado')
    .order('categoria', { nullsFirst: false }).order('nombre');

  let conTels = [];
  if (registros.length) {
    const ids = registros.map((r) => r.id);
    const { data: tels = [] } = await supabase.from('directorio_telefonos').select('*').in('directorio_id', ids);
    const porReg = {};
    for (const t of tels) (porReg[t.directorio_id] ??= []).push(t);
    conTels = registros.map((r) => ({ ...r, telefonos: porReg[r.id] || [] }));
  }

  return (
    <FichaShell>
      <div className="wrap ficha">
        <h1 className="ficha-h1">Directorio</h1>
        <p className="ficha-resumen">Teléfonos de dependencias, servicios y números útiles de San Juan del Río.</p>
        {conTels.length === 0 ? (
          <p className="ficha-vacio">Aún no hay registros publicados. Muy pronto.</p>
        ) : (
          <DirectorioLista registros={conTels} />
        )}
      </div>
    </FichaShell>
  );
}
