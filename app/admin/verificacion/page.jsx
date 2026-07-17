import { supabaseAdmin } from '../../../lib/supabase-admin';
import AdminChrome from '../AdminChrome';
import { calcularCola, DIAS_VENCE } from '../../../lib/cola-verificacion';

export const dynamic = 'force-dynamic';

const RUTA = { tramite: 'tramites', dependencia: 'dependencias', directorio: 'directorio' };
const TIPO_LABEL = { tramite: 'Trámite', dependencia: 'Dependencia', directorio: 'Directorio' };

async function nombres(tipo, tabla, ids) {
  if (!ids.length) return {};
  const { data = [] } = await supabaseAdmin.from(tabla).select('id, nombre').in('id', ids);
  return Object.fromEntries(data.map((r) => [r.id, r.nombre]));
}

function Fila({ item, nombre }) {
  return (
    <tr>
      <td><span className="admin-muted">{TIPO_LABEL[item.tipo]}</span></td>
      <td>{nombre || <span className="admin-mono admin-muted">{item.id.slice(0, 8)}…</span>}</td>
      <td>{item.grupo}</td>
      <td>
        {item.motivo === 'vencido'
          ? <span className="estado-badge estado-vencido">vencido · {item.dias} días</span>
          : <span className="estado-badge estado-retirado">invalidado</span>}
      </td>
      <td><a className="admin-link" href={`/admin/${RUTA[item.tipo]}/${item.id}`}>Reverificar →</a></td>
    </tr>
  );
}

export default async function ColaVerificacionPage() {
  const cola = await calcularCola(supabaseAdmin);
  const items = [...cola.invalidados, ...cola.vencidos];

  const porTipo = { tramite: [], dependencia: [], directorio: [] };
  for (const it of items) porTipo[it.tipo]?.push(it.id);
  const [nTram, nDep, nDir] = await Promise.all([
    nombres('tramite', 'tramites', [...new Set(porTipo.tramite)]),
    nombres('dependencia', 'dependencias', [...new Set(porTipo.dependencia)]),
    nombres('directorio', 'directorio', [...new Set(porTipo.directorio)]),
  ]);
  const nombreDe = (it) => (it.tipo === 'tramite' ? nTram : it.tipo === 'dependencia' ? nDep : nDir)[it.id];

  return (
    <AdminChrome>
      <main className="admin-main">
        <div className="admin-page-head">
          <span className="eyebrow">Contenido</span>
          <h1>Cola de verificación <span className="admin-count">{cola.total}</span></h1>
          <p className="lead">Grupos que necesitan reverificarse: <b>invalidados</b> por una edición, o <b>vencidos</b> (más de {DIAS_VENCE} días). La fecha pública sale de estas verificaciones.</p>
        </div>

        {cola.total === 0 ? (
          <div className="admin-empty"><span className="admin-empty-icon">✅</span><p>Todo al día. No hay grupos por reverificar.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Tipo</th><th>Entidad</th><th>Grupo</th><th>Motivo</th><th></th></tr></thead>
              <tbody>
                {cola.invalidados.map((it, i) => <Fila key={`i${i}`} item={it} nombre={nombreDe(it)} />)}
                {cola.vencidos.map((it, i) => <Fila key={`v${i}`} item={it} nombre={nombreDe(it)} />)}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminChrome>
  );
}
