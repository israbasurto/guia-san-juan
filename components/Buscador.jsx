'use client';
import { useEffect, useRef, useState } from 'react';
import { registrarBusquedaSinResultado } from '../app/buscador-actions';
import { buscar } from '../lib/buscar';

export default function Buscador({ variant = 'default', placeholder = '¿Qué trámite necesitas?' }) {
  const [indice, setIndice] = useState(null);
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(false);
  const logTimer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    fetch('/indice').then((r) => r.json()).then((d) => setIndice(d.items || [])).catch(() => setIndice([]));
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const consulta = q.trim();
  const hayTokens = consulta.length >= 2;
  const resultados = hayTokens ? buscar(indice, consulta) : [];
  const sinResultado = hayTokens && indice && resultados.length === 0;

  // Registrar búsquedas sin resultado tras una pausa (sin datos personales).
  useEffect(() => {
    clearTimeout(logTimer.current);
    if (sinResultado && consulta.length >= 3) {
      logTimer.current = setTimeout(() => { registrarBusquedaSinResultado(consulta).catch(() => {}); }, 1400);
    }
    return () => clearTimeout(logTimer.current);
  }, [sinResultado, consulta]);

  return (
    <div className={`buscador buscador--${variant}`} ref={boxRef}>
      <div className="buscador-campo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          className="buscador-input"
          placeholder={placeholder}
          value={q}
          onChange={(e) => { setQ(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          aria-label="Buscar trámites y dependencias"
          autoComplete="off"
        />
      </div>

      {abierto && hayTokens && (
        <div className="buscador-resultados" role="listbox">
          {resultados.length > 0 ? (
            resultados.map((it) => (
              <a key={it.url} href={it.url} className="buscador-item" role="option">
                <span className={`buscador-tipo buscador-tipo--${it.tipo}`}>{it.tipo === 'tramite' ? 'Trámite' : 'Dependencia'}</span>
                <span className="buscador-nombre">{it.nombre}</span>
                {it.detalle && <span className="buscador-detalle">{it.detalle}</span>}
              </a>
            ))
          ) : indice === null ? (
            <p className="buscador-vacio">Cargando…</p>
          ) : (
            <p className="buscador-vacio">
              No encontramos nada para “{q.trim()}”. Estamos agregando trámites poco a poco — lo registramos para priorizarlo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
