import { supabaseAdmin } from '../../../lib/supabase-admin';
import AdminChrome from '../AdminChrome';

export const dynamic = 'force-dynamic';

export default async function DependenciasPage() {
  const { data: deps = [] } = await supabaseAdmin
    .from('dependencias')
    .select('id, nombre, slug, estado, actualizado_en')
    .order('nombre');

  return (
    <AdminChrome>
      <main className="admin-main">
        <div className="admin-page-head admin-page-head--row">
          <div>
            <span className="eyebrow">Contenido</span>
            <h1>Dependencias <span className="admin-count">{deps.length}</span></h1>
          </div>
          <a className="btn btn--primary" href="/admin/dependencias/nueva">+ Nueva dependencia</a>
        </div>

        {deps.length === 0 ? (
          <div className="admin-empty"><span className="admin-empty-icon">🏛️</span><p>Aún no hay dependencias. Crea la primera.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Nombre</th><th>Slug</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {deps.map((d) => (
                  <tr key={d.id}>
                    <td>{d.nombre}</td>
                    <td className="admin-mono">{d.slug}</td>
                    <td><span className={`estado-badge estado-${d.estado}`}>{d.estado}</span></td>
                    <td><a className="admin-link" href={`/admin/dependencias/${d.id}`}>Editar →</a></td>
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
