import { supabaseAdmin } from '../../lib/supabase-admin';
import AdminChrome from './AdminChrome';
import ProposalCard from './ProposalCard';

export const dynamic = 'force-dynamic';

const ESTADOS = ['todas', 'pendiente', 'aprobada', 'rechazada'];
const LABEL   = { todas: 'Todas', pendiente: 'Pendientes', aprobada: 'Aprobadas', rechazada: 'Rechazadas' };

const STAT_ICONS = {
  total:    '📋',
  pending:  '⏳',
  approved: '✓',
  rejected: '✕',
};

export default async function AdminPage({ searchParams }) {
  const params = await searchParams;
  const filtro = ESTADOS.includes(params?.estado) ? params.estado : 'todas';

  const query = supabaseAdmin.from('propuestas').select('*').order('creado_at', { ascending: false });
  if (filtro !== 'todas') query.eq('estado', filtro);
  const { data: proposals = [] } = await query;

  const { data: counts = [] } = await supabaseAdmin.from('propuestas').select('estado');
  const total     = counts.length;
  const pendiente = counts.filter(r => r.estado === 'pendiente').length;
  const aprobada  = counts.filter(r => r.estado === 'aprobada').length;
  const rechazada = counts.filter(r => r.estado === 'rechazada').length;

  const tabCounts = { todas: total, pendiente, aprobada, rechazada };

  return (
    <AdminChrome>
      <main className="admin-main">
        {/* Page head */}
        <div className="admin-page-head">
          <span className="eyebrow">Panel de administración</span>
          <h1>
            Propuestas
            {pendiente > 0 && (
              <span className="admin-pending-badge">{pendiente} pendiente{pendiente !== 1 ? 's' : ''}</span>
            )}
          </h1>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat admin-stat--total">
            <span className="admin-stat-icon">{STAT_ICONS.total}</span>
            <b>{total}</b>
            <span className="admin-stat-label">Total</span>
          </div>
          <div className="admin-stat admin-stat--pending">
            <span className="admin-stat-icon">{STAT_ICONS.pending}</span>
            <b>{pendiente}</b>
            <span className="admin-stat-label">Pendientes</span>
          </div>
          <div className="admin-stat admin-stat--approved">
            <span className="admin-stat-icon">{STAT_ICONS.approved}</span>
            <b>{aprobada}</b>
            <span className="admin-stat-label">Aprobadas</span>
          </div>
          <div className="admin-stat admin-stat--rejected">
            <span className="admin-stat-icon">{STAT_ICONS.rejected}</span>
            <b>{rechazada}</b>
            <span className="admin-stat-label">Rechazadas</span>
          </div>
        </div>

        {/* Filtros */}
        <nav className="admin-tabs" aria-label="Filtrar propuestas">
          {ESTADOS.map((e) => (
            <a
              key={e}
              href={e === 'todas' ? '/admin' : `/admin?estado=${e}`}
              className={`admin-tab${filtro === e ? ' active' : ''}`}
            >
              {LABEL[e]}
              {tabCounts[e] > 0 && (
                <span className="admin-tab-count">{tabCounts[e]}</span>
              )}
            </a>
          ))}
        </nav>

        {/* Lista */}
        {proposals.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty-icon">📭</span>
            <p>No hay propuestas {filtro !== 'todas' ? `"${LABEL[filtro].toLowerCase()}"` : 'todavía'}.</p>
          </div>
        ) : (
          <div className="prop-grid">
            {proposals.map((p) => (
              <ProposalCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>
    </AdminChrome>
  );
}
