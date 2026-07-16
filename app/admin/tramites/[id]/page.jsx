import { notFound } from 'next/navigation';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import AdminChrome from '../../AdminChrome';
import TramiteForm from '../../TramiteForm';
import EstadoControl from '../../EstadoControl';
import CtaControl from '../../CtaControl';
import VerificacionForm from '../../VerificacionForm';
import { agregarCostoTramite, eliminarCostoTramite } from '../../contenido-actions';

export const dynamic = 'force-dynamic';

const GRUPOS_TRAMITE = ['requisitos', 'costos', 'contacto', 'ubicacion', 'horarios_propios', 'representacion'];

function fecha(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}
function importe(c) {
  if (c.importe_min == null && c.importe_max == null) return '—';
  if (c.importe_max != null && c.importe_max !== c.importe_min) return `$${c.importe_min ?? 0}–$${c.importe_max}`;
  return `$${c.importe_min ?? c.importe_max}`;
}

export default async function EditarTramitePage({ params }) {
  const { id } = await params;
  const { data: t } = await supabaseAdmin.from('tramites').select('*').eq('id', id).single();
  if (!t) notFound();

  const [{ data: dependencias = [] }, { data: categorias = [] }, { data: costos = [] }, { data: vers = [] }] = await Promise.all([
    supabaseAdmin.from('dependencias').select('id, nombre').order('nombre'),
    supabaseAdmin.from('categorias_tramite').select('id, nombre').order('orden'),
    supabaseAdmin.from('costos_tramite').select('*').eq('tramite_id', id),
    supabaseAdmin.from('tramite_verificaciones').select('*').eq('tramite_id', id).order('verificado_en', { ascending: false }),
  ]);

  const obligatorios = t.grupos_obligatorios || [];
  const vigentes = new Set(vers.filter((v) => !v.invalidada_en && v.resultado === 'confirmado').map((v) => v.grupo));
  const faltan = obligatorios.filter((g) => !vigentes.has(g));

  return (
    <AdminChrome>
      <main className="admin-main admin-main--narrow">
        <div className="admin-page-head">
          <a className="admin-link" href="/admin/tramites">← Trámites</a>
          <h1>{t.nombre} <span className={`estado-badge estado-${t.estado}`}>{t.estado}</span></h1>
          <p className="admin-mono admin-muted">/tramites/{t.slug} · CTA: {t.cta_estado}</p>
        </div>

        <section className="admin-section">
          <h2 className="admin-section-title">Publicación</h2>
          {obligatorios.length > 0 && (
            <p className={`admin-gate ${faltan.length ? 'admin-gate--no' : 'admin-gate--ok'}`}>
              {faltan.length
                ? `Para publicar faltan verificar (vigentes): ${faltan.join(', ')}`
                : 'Grupos obligatorios verificados: se puede publicar.'}
            </p>
          )}
          <EstadoControl tipo="tramite" id={t.id} estado={t.estado} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">CTA de gestoría (comercial)</h2>
          <p className="admin-muted">Activar exige representación aprobada (M11) y un honorario en costos (M19).</p>
          <CtaControl id={t.id} cta_estado={t.cta_estado} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Datos</h2>
          <TramiteForm tramite={t} dependencias={dependencias} categorias={categorias} />
        </section>

        <section className="admin-section">
          <h2 className="admin-section-title">Costos</h2>
          {costos.length === 0 ? <p className="admin-muted">Sin costos.</p> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Concepto</th><th>Categoría</th><th>Tipo</th><th>Importe</th><th></th></tr></thead>
                <tbody>
                  {costos.map((c) => (
                    <tr key={c.id}>
                      <td>{c.concepto}</td>
                      <td>{c.categoria}</td>
                      <td>{c.tipo}</td>
                      <td className="admin-mono">{importe(c)} {c.moneda}</td>
                      <td>
                        <form action={eliminarCostoTramite}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="tramite_id" value={t.id} />
                          <button className="admin-link admin-link--danger" type="submit">Quitar</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <form action={agregarCostoTramite} className="admin-inline admin-inline--wrap">
            <input type="hidden" name="tramite_id" value={t.id} />
            <input name="concepto" className="pf-field" placeholder="Concepto" required />
            <select name="categoria" className="pf-field" style={{ maxWidth: 150 }}>
              <option value="derecho">derecho</option><option value="honorario">honorario</option>
              <option value="gasto">gasto</option><option value="otro">otro</option>
            </select>
            <select name="tipo" className="pf-field" style={{ maxWidth: 130 }}>
              <option value="fijo">fijo</option><option value="rango">rango</option>
              <option value="desde">desde</option><option value="desconocido">desconocido</option>
            </select>
            <input name="importe_min" className="pf-field" placeholder="Mín." style={{ maxWidth: 100 }} inputMode="decimal" />
            <input name="importe_max" className="pf-field" placeholder="Máx." style={{ maxWidth: 100 }} inputMode="decimal" />
            <button className="btn btn--ghost" type="submit">Agregar costo</button>
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
          <VerificacionForm tipo="tramite" id={t.id} grupos={GRUPOS_TRAMITE} />
        </section>
      </main>
    </AdminChrome>
  );
}
