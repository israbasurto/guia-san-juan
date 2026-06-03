'use client';
import { useTransition } from 'react';
import { updateEstado } from './actions';

const ESTADO_LABEL = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ProposalCard({ p }) {
  const [pending, startTransition] = useTransition();
  const handle = (estado) => startTransition(() => updateEstado(p.id, estado));

  return (
    <article className={`prop-card prop-card--${p.estado}`} style={{ opacity: pending ? 0.6 : 1 }}>
      <div className="prop-card-body">
        {/* Cabecera */}
        <header className="prop-card-head">
          <span className={`prop-badge prop-badge--${p.estado}`}>{ESTADO_LABEL[p.estado]}</span>
          <span className="prop-cat">{p.categoria}</span>
          <span className="prop-date">{formatDate(p.creado_at)}</span>
        </header>

        {/* Contenido */}
        <h3 className="prop-nombre">{p.nombre}</h3>
        <p className="prop-desc">{p.descripcion}</p>

        {/* Meta */}
        {(p.proponente || p.email) && (
          <div className="prop-meta">
            {p.proponente && (
              <span className="prop-meta-item">
                <span className="prop-meta-icon">👤</span>
                {p.proponente}
              </span>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`} className="prop-meta-item prop-email">
                <span className="prop-meta-icon">✉</span>
                {p.email}
              </a>
            )}
          </div>
        )}

        {/* Imágenes */}
        {p.imagenes?.length > 0 && (
          <div className="prop-imgs">
            {p.imagenes.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Imagen ${i + 1}`} className="prop-thumb" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <footer className="prop-card-foot">
        {p.estado === 'pendiente' ? (
          <>
            <button className="btn-action btn-action--reject" onClick={() => handle('rechazada')} disabled={pending}>
              Rechazar
            </button>
            <button className="btn-action btn-action--approve" onClick={() => handle('aprobada')} disabled={pending}>
              ✓ Aprobar
            </button>
          </>
        ) : (
          <button className="btn-action btn-action--undo" onClick={() => handle('pendiente')} disabled={pending}>
            Mover a pendiente
          </button>
        )}
      </footer>
    </article>
  );
}
