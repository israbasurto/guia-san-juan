import { supabaseAdmin } from '../../../../lib/supabase-admin';
import AdminChrome from '../../AdminChrome';
import TramiteForm from '../../TramiteForm';

export const dynamic = 'force-dynamic';

export default async function NuevoTramitePage() {
  const { data: dependencias = [] } = await supabaseAdmin.from('dependencias').select('id, nombre').order('nombre');

  return (
    <AdminChrome>
      <main className="admin-main admin-main--narrow">
        <div className="admin-page-head">
          <a className="admin-link" href="/admin/tramites">← Trámites</a>
          <h1>Nuevo trámite</h1>
          <p className="lead">Se crea en <b>borrador</b> con el CTA <b>oculto</b>. Después agregas costos, requisitos y verificaciones.</p>
        </div>
        <TramiteForm tramite={null} dependencias={dependencias} />
      </main>
    </AdminChrome>
  );
}
