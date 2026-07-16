import { notFound } from 'next/navigation';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import AdminChrome from '../../AdminChrome';
import DependenciaForm from '../../DependenciaForm';
import EstadoControl from '../../EstadoControl';
import VerificacionForm from '../../VerificacionForm';
import { agregarTelefonoDependencia, eliminarTelefonoDependencia } from '../../contenido-actions';

export const dynamic = 'force-dynamic';

const GRUPOS_DEP = ['contacto', 'ubicacion', 'horarios'];

function fecha(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

export default async function EditarDependenciaPage({ params }) {
  const { id } = await params;
  const { data: dep } = await supabaseAdmin.from('dependencias').select('*').eq('id', id).single();
  if (!dep) notFound();

  const [{ data: tels = [] }, { data: vers = [] }] = await Promise.all([
    supabaseAdmin.from('dependencia_telefonos').select('*').eq('dependencia_id', id),
    supabaseAdmin.from('dependencia_verificaciones').select('*').eq('dependencia_id', id).order('verificado_en', { ascending: false }),
  ]);

  return (
    <AdminChrome>
      <main className="admin-main admin-main--narrow">
        <div className="admin-page-head">
          <a className="admin-link" href="/admin/dependencias">← Dependencias</a>
          <h1>{dep.nombre} <span className={`estado-badge estado-${dep.estado}`}>{dep.estado}</span></h1>
          <p className="admin-mono admin-muted">/dependencias/{dep.slug}</p>
        </div>

        <section className="admin-section">
          <h2 className="admin-section-title">Estado editorial</h2>
          <EstadoControl tipo="dependencia" id={dep.id} estado={dep.estado} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Datos</h2>
          <DependenciaForm dependencia={dep} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Teléfonos</h2>
          {tels.length === 0 ? <p className="admin-muted">Sin teléfonos.</p> : (
            <ul className="admin-list">
              {tels.map((t) => (
                <li key={t.id} className="admin-list-row">
                  <span><b>{t.numero}</b>{t.extension ? ` ext. ${t.extension}` : ''}{t.etiqueta ? ` · ${t.etiqueta}` : ''}{t.confirmado ? ' ✓' : ''}</span>
                  <form action={eliminarTelefonoDependencia}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="dependencia_id" value={dep.id} />
                    <button className="admin-link admin-link--danger" type="submit">Quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={agregarTelefonoDependencia} className="admin-inline admin-inline--wrap">
            <input type="hidden" name="dependencia_id" value={dep.id} />
            <input name="numero" className="pf-field" placeholder="Número" required />
            <input name="extension" className="pf-field" placeholder="Ext." style={{ maxWidth: 90 }} />
            <input name="etiqueta" className="pf-field" placeholder="Etiqueta (ej. Recepción)" />
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
                      <td>{v.grupo}</td>
                      <td>{v.resultado}</td>
                      <td>{fecha(v.verificado_en)}</td>
                      <td>{v.invalidada_en ? <span className="estado-badge estado-vencido">invalidada</span> : <span className="estado-badge estado-publicado">vigente</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3 className="admin-subtitle">Registrar verificación</h3>
          <VerificacionForm tipo="dependencia" id={dep.id} grupos={GRUPOS_DEP} />
        </section>
      </main>
    </AdminChrome>
  );
}
