import { notFound } from 'next/navigation';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import AdminChrome from '../../AdminChrome';
import DirectorioForm from '../../DirectorioForm';
import EstadoControl from '../../EstadoControl';
import VerificacionForm from '../../VerificacionForm';
import { agregarTelefonoDirectorio, eliminarTelefonoDirectorio } from '../../contenido-actions';

export const dynamic = 'force-dynamic';

const GRUPOS_DIR = ['contacto', 'ubicacion'];

function fecha(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

export default async function EditarDirectorioPage({ params }) {
  const { id } = await params;
  const { data: reg } = await supabaseAdmin.from('directorio').select('*').eq('id', id).single();
  if (!reg) notFound();

  const [{ data: tels = [] }, { data: vers = [] }] = await Promise.all([
    supabaseAdmin.from('directorio_telefonos').select('*').eq('directorio_id', id),
    supabaseAdmin.from('directorio_verificaciones').select('*').eq('directorio_id', id).order('verificado_en', { ascending: false }),
  ]);

  return (
    <AdminChrome>
      <main className="admin-main admin-main--narrow">
        <div className="admin-page-head">
          <a className="admin-link" href="/admin/directorio">← Directorio</a>
          <h1>{reg.nombre} <span className={`estado-badge estado-${reg.estado}`}>{reg.estado}</span></h1>
        </div>

        <section className="admin-section">
          <h2 className="admin-section-title">Estado editorial</h2>
          <EstadoControl tipo="directorio" id={reg.id} estado={reg.estado} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Datos</h2>
          <DirectorioForm registro={reg} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Teléfonos</h2>
          {tels.length === 0 ? <p className="admin-muted">Sin teléfonos.</p> : (
            <ul className="admin-list">
              {tels.map((t) => (
                <li key={t.id} className="admin-list-row">
                  <span><b>{t.numero}</b>{t.extension ? ` ext. ${t.extension}` : ''}{t.etiqueta ? ` · ${t.etiqueta}` : ''}</span>
                  <form action={eliminarTelefonoDirectorio}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="directorio_id" value={reg.id} />
                    <button className="admin-link admin-link--danger" type="submit">Quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={agregarTelefonoDirectorio} className="admin-inline admin-inline--wrap">
            <input type="hidden" name="directorio_id" value={reg.id} />
            <input name="numero" className="pf-field" placeholder="Número" required />
            <input name="extension" className="pf-field" placeholder="Ext." style={{ maxWidth: 90 }} />
            <input name="etiqueta" className="pf-field" placeholder="Etiqueta" />
            <button className="btn btn--ghost" type="submit">Agregar teléfono</button>
          </form>
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Verificaciones por grupo</h2>
          {vers.length === 0 ? <p className="admin-muted">Sin verificaciones aún.</p> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Grupo</th><th>Resultado</th><th>Fecha</th><th>Vigencia</th></tr></thead>
                <tbody>
                  {vers.map((v) => (
                    <tr key={v.id}>
                      <td>{v.grupo}</td><td>{v.resultado}</td><td>{fecha(v.verificado_en)}</td>
                      <td>{v.invalidada_en ? <span className="estado-badge estado-vencido">invalidada</span> : <span className="estado-badge estado-publicado">vigente</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3 className="admin-subtitle">Registrar verificación</h3>
          <VerificacionForm tipo="directorio" id={reg.id} grupos={GRUPOS_DIR} />
        </section>
      </main>
    </AdminChrome>
  );
}
