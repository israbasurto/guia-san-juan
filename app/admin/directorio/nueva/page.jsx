import AdminChrome from '../../AdminChrome';
import DirectorioForm from '../../DirectorioForm';

export const dynamic = 'force-dynamic';

export default function NuevoDirectorioPage() {
  return (
    <AdminChrome>
      <main className="admin-main admin-main--narrow">
        <div className="admin-page-head">
          <a className="admin-link" href="/admin/directorio">← Directorio</a>
          <h1>Nuevo registro</h1>
          <p className="lead">Se crea en <b>borrador</b>. Después podrás agregar teléfonos y verificaciones.</p>
        </div>
        <DirectorioForm registro={null} />
      </main>
    </AdminChrome>
  );
}
