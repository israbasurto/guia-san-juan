import { supabaseAdmin } from '../../../lib/supabase-admin';
import AdminChrome from '../AdminChrome';

export const dynamic = 'force-dynamic';

export default async function GuiasPage() {
  const { data: guias = [] } = await supabaseAdmin
    .from('guias').select('id, titulo, slug, estado').order('actualizado_en', { ascending: false });

  return (
    <AdminChrome>
      <main className="admin-main">
        <div className="admin-page-head admin-page-head--row">
          <div>
            <span className="eyebrow">Contenido</span>
            <h1>Guías <span className="admin-count">{guias.length}</span></h1>
          </div>
          <a className="btn btn--primary" href="/admin/guias/nueva">+ Nueva guía</a>
        </div>
        {guias.length === 0 ? (
          <div className="admin-empty"><span className="admin-empty-icon">📝</span><p>Aún no hay guías.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Título</th><th>Slug</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {guias.map((g) => (
                  <tr key={g.id}>
                    <td>{g.titulo}</td>
                    <td className="admin-mono">{g.slug}</td>
                    <td><span className={`estado-badge estado-${g.estado}`}>{g.estado}</span></td>
                    <td><a className="admin-link" href={`/admin/guias/${g.id}`}>Editar →</a></td>
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
