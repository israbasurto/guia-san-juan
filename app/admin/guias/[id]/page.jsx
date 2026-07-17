import { notFound } from 'next/navigation';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import AdminChrome from '../../AdminChrome';
import GuiaForm from '../../GuiaForm';
import EstadoControl from '../../EstadoControl';
import { vincularTramiteGuia, desvincularTramiteGuia } from '../../contenido-actions';

export const dynamic = 'force-dynamic';

export default async function EditarGuiaPage({ params }) {
  const { id } = await params;
  const { data: guia } = await supabaseAdmin.from('guias').select('*').eq('id', id).single();
  if (!guia) notFound();

  const [{ data: vinculos = [] }, { data: tramites = [] }] = await Promise.all([
    supabaseAdmin.from('guias_tramites').select('tramite_id').eq('guia_id', id),
    supabaseAdmin.from('tramites').select('id, nombre').order('nombre'),
  ]);
  const nombreTramite = Object.fromEntries(tramites.map((t) => [t.id, t.nombre]));
  const vinculados = new Set(vinculos.map((v) => v.tramite_id));
  const disponibles = tramites.filter((t) => !vinculados.has(t.id));

  return (
    <AdminChrome>
      <main className="admin-main admin-main--narrow">
        <div className="admin-page-head">
          <a className="admin-link" href="/admin/guias">← Guías</a>
          <h1>{guia.titulo} <span className={`estado-badge estado-${guia.estado}`}>{guia.estado}</span></h1>
          <p className="admin-mono admin-muted">/guias/{guia.slug}</p>
        </div>

        <section className="admin-section">
          <h2 className="admin-section-title">Estado editorial</h2>
          <EstadoControl tipo="guia" id={guia.id} estado={guia.estado} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Contenido</h2>
          <GuiaForm guia={guia} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Trámites vinculados</h2>
          {vinculos.length === 0 ? <p className="admin-muted">Sin trámites vinculados.</p> : (
            <ul className="admin-list">
              {vinculos.map((v) => (
                <li key={v.tramite_id} className="admin-list-row">
                  <span>{nombreTramite[v.tramite_id] || v.tramite_id}</span>
                  <form action={desvincularTramiteGuia}>
                    <input type="hidden" name="guia_id" value={guia.id} />
                    <input type="hidden" name="tramite_id" value={v.tramite_id} />
                    <button className="admin-link admin-link--danger" type="submit">Quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          {disponibles.length > 0 && (
            <form action={vincularTramiteGuia} className="admin-inline admin-inline--wrap">
              <input type="hidden" name="guia_id" value={guia.id} />
              <select name="tramite_id" className="pf-field" required>
                {disponibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              <button className="btn btn--ghost" type="submit">Vincular trámite</button>
            </form>
          )}
        </section>
      </main>
    </AdminChrome>
  );
}
