'use client';
import { useState } from 'react';

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const tel = (n) => n.replace(/[^0-9+]/g, '');

export default function DirectorioLista({ registros }) {
  const [q, setQ] = useState('');
  const filtro = norm(q).trim();
  const visibles = filtro
    ? registros.filter((r) => norm(`${r.nombre} ${r.categoria || ''} ${r.direccion || ''}`).includes(filtro))
    : registros;

  return (
    <>
      <div className="buscador" style={{ marginBottom: 22 }}>
        <div className="buscador-campo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search" className="buscador-input" placeholder="Filtra por nombre o categoría…"
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filtrar directorio" autoComplete="off"
          />
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="ficha-vacio">Sin resultados para “{q.trim()}”.</p>
      ) : (
        <ul className="dir-lista">
          {visibles.map((r) => (
            <li key={r.id} className="dir-item">
              <div className="dir-item-info">
                <b className="dir-nombre">{r.nombre}</b>
                {r.categoria && <span className="dir-cat">{r.categoria}</span>}
                {r.direccion && <span className="dir-dir">{r.direccion}</span>}
              </div>
              <div className="dir-tels">
                {r.telefonos.filter((t) => t.numero).map((t) => (
                  <a key={t.id} className="btn btn--primary dir-tel" href={`tel:${tel(t.numero)}`}>
                    {t.etiqueta ? `${t.etiqueta}: ` : ''}{t.numero}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
