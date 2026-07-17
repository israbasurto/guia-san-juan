import ThemeToggle from './ThemeToggle';

// Chrome ligero para las páginas de contenido público (ficha de trámite/dependencia).
export default function FichaShell({ children }) {
  return (
    <>
      <header className="ficha-header">
        <div className="wrap ficha-header-in">
          <a className="brand" href="/" aria-label="Guía San Juan, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-GS.png" alt="" className="brand-logo" width={34} height={34} />
            <span>
              <span className="brand-name">Guía San Juan</span>
              <span className="brand-sub">San Juan del Río</span>
            </span>
          </a>
          <div className="ficha-header-cta">
            <a className="navlink" href="/tramites">Trámites</a>
            <a className="navlink" href="/dependencias">Dependencias</a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="ficha-main">{children}</main>

      <footer className="ficha-footer">
        <div className="wrap">
          <p>
            <b>Guía San Juan</b> es un proyecto de{' '}
            <a href="https://trinium.com.mx" target="_blank" rel="noopener noreferrer">Trinium</a>,
            independiente del Gobierno Municipal. No es un sitio oficial.
          </p>
          <p className="ficha-footer-copy">© 2026 Guía San Juan · Proyecto ciudadano no oficial</p>
        </div>
      </footer>
    </>
  );
}
