import AdminChrome from '../../AdminChrome';
import DependenciaForm from '../../DependenciaForm';

export const dynamic = 'force-dynamic';

export default function NuevaDependenciaPage() {
  return (
    <AdminChrome>
      <main className="admin-main admin-main--narrow">
        <div className="admin-page-head">
          <a className="admin-link" href="/admin/dependencias">← Dependencias</a>
          <h1>Nueva dependencia</h1>
          <p className="lead">Se crea en <b>borrador</b>. Después podrás agregar contacto, ubicación y verificaciones.</p>
        </div>
        <DependenciaForm dependencia={null} />
      </main>
    </AdminChrome>
  );
}
