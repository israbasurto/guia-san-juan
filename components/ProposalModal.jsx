'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ProposalModal() {
  const [open, setOpen]         = useState(false);
  const [fileErr, setFileErr]   = useState(false);
  const [files, setFiles]       = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState(null);

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
      // Subir imágenes al bucket "propuestas"
      const imageUrls = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('propuestas')
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage
          .from('propuestas')
          .getPublicUrl(path);
        imageUrls.push(publicUrl);
      }

      // Insertar propuesta
      const fd = new FormData(e.target);
      const { error: insertErr } = await supabase.from('propuestas').insert({
        categoria:   fd.get('categoria'),
        nombre:      fd.get('nombre'),
        descripcion: fd.get('descripcion'),
        proponente:  fd.get('proponente') || null,
        email:       fd.get('email')      || null,
        imagenes:    imageUrls.length ? imageUrls : null,
      });
      if (insertErr) throw insertErr;

      setSuccess(true);
      setFiles([]);
    } catch (err) {
      console.error(err);
      setError('Hubo un problema al enviar tu propuesta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="notify-box reveal">
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
                <div className="pf-row">
                  <label className="pf-label" htmlFor="pf-cat">Categoría</label>
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
                  <label className="pf-label" htmlFor="pf-nombre">Nombre del lugar o evento</label>
                  <input className="pf-field" id="pf-nombre" name="nombre" type="text" placeholder="Ej. Restaurante El Mesón" required />
                </div>
                <div className="pf-row">
                  <label className="pf-label" htmlFor="pf-desc">¿Por qué merece estar aquí?</label>
                  <textarea className="pf-field pf-textarea" id="pf-desc" name="descripcion" placeholder="Cuéntanos brevemente…" required />
                </div>
                <div className="pf-cols">
                  <div className="pf-row">
                    <label className="pf-label" htmlFor="pf-quien">Tu nombre (opcional)</label>
                    <input className="pf-field" id="pf-quien" name="proponente" type="text" placeholder="Tu nombre" />
                  </div>
                  <div className="pf-row">
                    <label className="pf-label" htmlFor="pf-email">Tu email (opcional)</label>
                    <input className="pf-field" id="pf-email" name="email" type="email" placeholder="Para avisarte si se aprueba" />
                  </div>
                </div>
                <div className="pf-row">
                  <span className="pf-label">Imágenes (máx. 5, opcional)</span>
                  <div className="pf-file-zone">
                    <input type="file" id="pf-imgs" name="imagenes" accept="image/*" multiple onChange={handleFiles} />
                    <span className="pf-fz-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
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
                  <p className="pf-note">Revisamos cada propuesta antes de publicarla.</p>
                  <button className="btn btn--primary" type="submit" disabled={submitting}>
                    {submitting ? 'Enviando…' : <>Enviar propuesta <span className="arrow">→</span></>}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
