import { supabaseAdmin } from '../../../lib/supabase-admin';
import AdminChrome from '../AdminChrome';

export const dynamic = 'force-dynamic';

export default async function TramitesPage() {
  const { data: tramites = [] } = await supabaseAdmin
    .from('tramites')
    .select('id, nombre, slug, estado, cta_estado, dependencia_id')
    .order('nombre');

  const depIds = [...new Set(tramites.map((t) => t.dependencia_id).filter(Boolean))];
  const { data: deps = [] } = depIds.length
    ? await supabaseAdmin.from('dependencias').select('id, nombre').in('id', depIds)
    : { data: [] };
  const depNombre = Object.fromEntries(deps.map((d) => [d.id, d.nombre]));

  return (
    <AdminChrome>
      <main className="admin-main">
        <div className="admin-page-head admin-page-head--row">
          <div>
            <span className="eyebrow">Contenido</span>
            <h1>Trámites <span className="admin-count">{tramites.length}</span></h1>
          </div>
          <a className="btn btn--primary" href="/admin/tramites/nueva">+ Nuevo trámite</a>
        </div>

        {tramites.length === 0 ? (
          <div className="admin-empty"><span className="admin-empty-icon">📄</span><p>Aún no hay trámites. Crea el primero.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Nombre</th><th>Dependencia</th><th>Estado</th><th>CTA</th><th></th></tr></thead>
              <tbody>
                {tramites.map((t) => (
                  <tr key={t.id}>
                    <td>{t.nombre}</td>
                    <td className="admin-muted">{depNombre[t.dependencia_id] || '—'}</td>
                    <td><span className={`estado-badge estado-${t.estado}`}>{t.estado}</span></td>
                    <td><span className="admin-mono admin-muted">{t.cta_estado}</span></td>
                    <td><a className="admin-link" href={`/admin/tramites/${t.id}`}>Editar →</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminChrome>
  );
}
