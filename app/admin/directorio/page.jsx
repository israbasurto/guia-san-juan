import { supabaseAdmin } from '../../../lib/supabase-admin';
import AdminChrome from '../AdminChrome';

export const dynamic = 'force-dynamic';

export default async function DirectorioPage() {
  const { data: registros = [] } = await supabaseAdmin
    .from('directorio').select('id, nombre, categoria, estado').order('nombre');

  return (
    <AdminChrome>
      <main className="admin-main">
        <div className="admin-page-head admin-page-head--row">
          <div>
            <span className="eyebrow">Contenido</span>
            <h1>Directorio <span className="admin-count">{registros.length}</span></h1>
          </div>
          <a className="btn btn--primary" href="/admin/directorio/nueva">+ Nuevo registro</a>
        </div>
        {registros.length === 0 ? (
          <div className="admin-empty"><span className="admin-empty-icon">📇</span><p>Aún no hay registros en el directorio.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Nombre</th><th>Categoría</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {registros.map((d) => (
                  <tr key={d.id}>
                    <td>{d.nombre}</td>
                    <td className="admin-muted">{d.categoria || '—'}</td>
                    <td><span className={`estado-badge estado-${d.estado}`}>{d.estado}</span></td>
                    <td><a className="admin-link" href={`/admin/directorio/${d.id}`}>Editar →</a></td>
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
