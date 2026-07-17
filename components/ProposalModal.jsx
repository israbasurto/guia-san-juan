'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { prepararSubidas, enviarPropuesta } from '../app/actions/propuestas';

export default function ProposalModal() {
  const [open, setOpen]         = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [fileErr, setFileErr]   = useState(false);
  const [files, setFiles]       = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const closeModal = () => {
    setOpen(false);
    setSuccess(false);
    setError(null);
  };

  const handleFiles = (e) => {
    if (e.target.files.length > 5) {
      setFileErr(true);
      e.target.value = '';
      setFiles([]);
    } else {
      setFileErr(false);
      setFiles([...e.target.files]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Subir imágenes con URLs firmadas de un solo uso emitidas por el servidor
      const rutas = [];
      if (files.length > 0) {
        const prep = await prepararSubidas(files.map((f) => f.type));
        if (prep.error) throw new Error(prep.error);
        for (let i = 0; i < files.length; i++) {
          const { path, token } = prep.subidas[i];
          const { error: uploadErr } = await supabase.storage
            .from('propuestas')
            .uploadToSignedUrl(path, token, files[i]);
          if (uploadErr) throw uploadErr;
          rutas.push(path);
        }
      }

      // El texto se valida e inserta en el servidor
      const fd = new FormData(e.target);
      fd.delete('imagenes');
      const res = await enviarPropuesta(fd, rutas);
      if (res.error) throw new Error(res.error);

      setSuccess(true);
      setFiles([]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Hubo un problema al enviar tu propuesta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className={`modal-backdrop${open ? ' open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="modal-panel">
        <button className="modal-close" onClick={closeModal} aria-label="Cerrar">✕</button>

        {success ? (
          <div className="pf-success">
            <span className="pf-success-icon" aria-hidden="true">✓</span>
            <h2 className="modal-title">¡Propuesta recibida!</h2>
            <p className="modal-subtitle">
              Gracias por contribuir a la guía. Revisamos cada propuesta antes de publicarla
              y te avisaremos si dejaste tu email.
            </p>
            <button className="btn btn--primary" style={{ marginTop: '24px' }} onClick={closeModal}>
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 className="modal-title" id="modal-title">Envía tu propuesta</h2>
            <p className="modal-subtitle">
              ¿Conoces un lugar, evento o negocio que merece estar en la guía? Cuéntanos — revisamos
              cada propuesta antes de publicarla.
            </p>

            <form className="proposal-form" onSubmit={handleSubmit}>

              {/* Honeypot anti-spam: invisible para personas */}
              <input
                type="text"
                name="sitio_web"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              />

              {/* Categoría + Nombre — 2 columnas en desktop */}
              <div className="pf-cols">
                <div className="pf-row">
                  <label className="pf-label" htmlFor="pf-cat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    Categoría
                  </label>
                  <select className="pf-field" id="pf-cat" name="categoria" required defaultValue="">
                    <option value="" disabled>Elige una categoría…</option>
                    <option>01 · Lugares para visitar</option>
                    <option>02 · Eventos de la ciudad</option>
                    <option>03 · Guía de comercios locales</option>
                    <option>04 · Recomendaciones familiares</option>
                    <option>05 · Rutas culturales</option>
                    <option>06 · Espacios para negocios sanjuanenses</option>
                  </select>
                </div>
                <div className="pf-row">
                  <label className="pf-label" htmlFor="pf-nombre">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>
                    </svg>
                    Nombre del lugar o evento
                  </label>
                  <input className="pf-field" id="pf-nombre" name="nombre" type="text" placeholder="Ej. Restaurante El Mesón" required />
                </div>
              </div>

              <div className="pf-row">
                <label className="pf-label" htmlFor="pf-desc">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  ¿Por qué merece estar aquí?
                </label>
                <textarea className="pf-field pf-textarea" id="pf-desc" name="descripcion" placeholder="Cuéntanos brevemente por qué este lugar merece estar en la guía…" required />
              </div>

              {/* Divisor — datos de contacto */}
              <div className="pf-divider">
                <span>Tus datos <em>(opcionales)</em></span>
              </div>

              <div className="pf-cols">
                <div className="pf-row">
                  <label className="pf-label" htmlFor="pf-quien">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Tu nombre
                  </label>
                  <input className="pf-field" id="pf-quien" name="proponente" type="text" placeholder="Tu nombre" />
                </div>
                <div className="pf-row">
                  <label className="pf-label" htmlFor="pf-email">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    Tu email
                  </label>
                  <input className="pf-field" id="pf-email" name="email" type="email" placeholder="Para avisarte si se aprueba" />
                </div>
              </div>

              <div className="pf-row">
                <span className="pf-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                  </svg>
                  Imágenes <em style={{ fontStyle: 'normal', fontWeight: 400, fontSize: '13px', color: 'var(--muted)' }}>(máx. 5, opcional)</em>
                </span>
                <div className="pf-file-zone">
                  <input type="file" id="pf-imgs" name="imagenes" accept="image/*" multiple onChange={handleFiles} />
                  <span className="pf-fz-icon" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </span>
                  <span className="pf-fz-text">Arrastra imágenes o <u>selecciona archivos</u></span>
                  <span className="pf-fz-sub">JPG · PNG · WebP · máx. 5 archivos</span>
                </div>
                {fileErr && <p className="pf-file-err">Solo puedes adjuntar hasta 5 imágenes.</p>}
                {files.length > 0 && (
                  <ul className="pf-file-list">
                    {files.map((f, i) => (
                      <li key={i}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                        <span className="pf-fname">{f.name}</span>
                        <span className="pf-fsize">{(f.size / 1024).toFixed(0)} KB</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && <p className="pf-file-err" style={{ marginTop: 0 }}>{error}</p>}

              <div className="pf-footer">
                <p className="pf-note">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', color: 'var(--accent)' }}>
                    <path d="M12 3 5 6v5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z"/><path d="m9 11.5 2 2 4-4"/>
                  </svg>
                  Revisamos cada propuesta antes de publicarla. Al enviar aceptas nuestro{' '}
                  <a href="/privacidad" target="_blank" rel="noopener noreferrer">aviso de privacidad</a>.
                </p>
                <button className="btn btn--primary" type="submit" disabled={submitting}>
                  {submitting ? 'Enviando…' : <>Enviar propuesta <span className="arrow">→</span></>}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="notify-box">
        <span className="notify-eyebrow">Contribuye a la guía</span>
        <p className="notify-lead">¿Quieres aportar?</p>
        <p className="notify-sub">
          ¿Conoces un lugar, evento o negocio que merece estar aquí?
          Cuéntanos — revisamos cada propuesta antes de publicarla.
        </p>
        <button className="btn btn--primary" onClick={() => setOpen(true)}>
          Enviar una propuesta <span className="arrow">→</span>
        </button>
      </div>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
