// Disclaimer inequívoco (M4, PLAN.md §1.1). Reutilizable en cada ficha.
export default function DisclaimerOficial({ dependencia }) {
  return (
    <aside className="disclaimer-oficial" role="note" aria-label="Aviso de independencia">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
      </svg>
      <p>
        <b>Guía San Juan es un proyecto de Trinium, independiente del Gobierno Municipal
        {dependencia ? ` y de ${dependencia}` : ' y de las dependencias públicas mencionadas'}.</b>{' '}
        No es un sitio oficial. La información es de referencia; confírmala por teléfono antes de acudir.
      </p>
    </aside>
  );
}
