import AdminChrome from '../../AdminChrome';
import GuiaForm from '../../GuiaForm';

export const dynamic = 'force-dynamic';

export default function NuevaGuiaPage() {
  return (
    <AdminChrome>
      <main className="admin-main admin-main--narrow">
        <div className="admin-page-head">
          <a className="admin-link" href="/admin/guias">← Guías</a>
          <h1>Nueva guía</h1>
          <p className="lead">Se crea en <b>borrador</b>. Después podrás escribir el contenido y vincular trámites.</p>
        </div>
        <GuiaForm guia={null} />
      </main>
    </AdminChrome>
  );
}
