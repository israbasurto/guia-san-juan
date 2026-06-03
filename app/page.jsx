import ThemeToggle from '../components/ThemeToggle';
import Countdown from '../components/Countdown';
import BadgeDays from '../components/BadgeDays';
import ProposalModal from '../components/ProposalModal';
import ClientEffects from '../components/ClientEffects';

export default function Home() {
  return (
    <>
      <ClientEffects />

      {/* HEADER */}
      <header className="site-header" id="siteHeader">
        <div className="wrap nav">
          <a className="brand" href="#top" aria-label="Guía San Juan, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-GS.png" alt="" className="brand-logo" width={38} height={38} />
            <span>
              <span className="brand-name">Guía San Juan</span>
              <span className="brand-sub">San Juan del Río</span>
            </span>
          </a>
          <nav className="nav-links" aria-label="Secciones">
            <a className="navlink" href="#feria">Feria 2026</a>
            <a className="navlink" href="#proyecto">El proyecto</a>
            <a className="navlink" href="#pronto">Muy pronto</a>
          </nav>
          <div className="nav-cta">
            <a className="btn btn--primary" href="https://guiaferiasjr.vercel.app">
              Feria 2026 <span className="arrow">→</span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero section" aria-label="Presentación">
          <svg className="route-line" viewBox="0 0 380 320" aria-hidden="true">
            <path d="M10,300 C90,250 60,170 150,150 C240,130 210,60 330,30" />
            <circle className="node" cx="10" cy="300" r="4" />
            <circle className="node" cx="150" cy="150" r="4" />
            <circle className="node" cx="330" cy="30" r="4" />
          </svg>
          <div className="wrap hero-grid">
            <div className="hero-copy hero-entrance" style={{ animationDelay: '0.1s' }}>
              <span className="hero-badge">
                <span className="dot"></span>{' '}
                La Feria 2026 empieza en <BadgeDays /> días —{' '}
                <b>¡Ya puedes consultarla!</b>
              </span>
              <h1>Guía <span className="accentword">San Juan</span></h1>
              <p className="hero-sub">Eventos, lugares y lo mejor de San Juan del Río.</p>
              <p className="hero-support">
                Encuentra qué hacer este fin de semana, a dónde ir con la familia, qué negocios visitar
                y qué eventos no te puedes perder. Todo en un solo lugar, claro y fácil de usar.
              </p>
              <div className="hero-pills">
                <a className="pill" href="https://guiaferiasjr.vercel.app">🎪 Feria 2026</a>
                <a className="pill" href="#proyecto">📍 Lugares</a>
                <a className="pill" href="#proyecto">🎶 Eventos</a>
                <a className="pill" href="#proyecto">🛍️ Comercios</a>
                <a className="pill" href="#proyecto">🗺️ Rutas</a>
              </div>
              <div className="hero-actions">
                <a className="btn btn--primary" href="https://guiaferiasjr.vercel.app">
                  Consultar Feria San Juan 2026 <span className="arrow">→</span>
                </a>
                <a className="btn btn--ghost" href="#proyecto">¿Qué es Guía San Juan?</a>
              </div>
              <div className="hero-meta">
                <div className="item"><b>Gratis</b><span>Toda la info, sin costo</span></div>
                <div className="divider"></div>
                <div className="item"><b>Actualizada</b><span>Eventos y horarios al día</span></div>
                <div className="divider"></div>
                <div className="item"><b>Independiente</b><span>Hecha por gente de aquí</span></div>
              </div>
            </div>

            <div className="hero-media hero-entrance" style={{ animationDelay: '0.25s' }}>
              <div className="hero-frame">
                <img
                  src="/assets/puente_san_juan.webp"
                  alt="Puente de la Historia, San Juan del Río"
                  className="slot-fill"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
                <div className="hero-tag">
                  <span className="pin" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>
                  <span>
                    <span className="t">Puente de la Historia</span>
                    <span className="s"> Símbolo de San Juan del Río</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FERIA */}
        <section className="section" id="feria" aria-label="Feria San Juan del Río 2026">
          <div className="wrap">
            <div className="feria on-deep reveal">
              <div className="feria-grid">
                <div className="feria-body">
                  <span className="feria-flag">★ Ya disponible</span>
                  <h2>Feria San Juan del Río 2026</h2>
                  <p>Consulta artistas, fechas, escenarios, horarios y actividades en una guía clara, rápida y fácil de usar.</p>
                  <div className="feria-dates">
                    <div className="feria-date">
                      <span className="cal"><b>18</b><span>Jun</span></span>
                      <span className="txt"><b>Arranca la feria</b><span>Inauguración y primeros eventos</span></span>
                    </div>
                    <div className="feria-date">
                      <span className="cal"><b>30</b><span>Jun</span></span>
                      <span className="txt"><b>Última noche</b><span>Cierre de actividades</span></span>
                    </div>
                  </div>
                  <Countdown />
                  <div className="feria-actions">
                    <a className="btn btn--primary" href="https://guiaferiasjr.vercel.app">
                      Ir a la guía de la feria <span className="arrow">→</span>
                    </a>
                  </div>
                </div>
                <div className="feria-media">
                  <img
                    src="/assets/feria_familia.webp"
                    alt="Feria San Juan del Río 2026"
                    className="slot-fill"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUÉ SERÁ */}
        <section className="section" id="proyecto" aria-label="Qué será Guía San Juan">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">¿Qué encuentras aquí?</span>
              <h2>Todo sobre San Juan, en un solo lugar</h2>
              <p className="lead">
                Deja de buscar en 10 sitios distintos. Aquí vas a encontrar eventos, lugares, comercios, rutas
                y recomendaciones — todo actualizado, bien organizado y fácil de consultar.
              </p>
            </div>
            <div className="card-grid">
              <article className="feature reveal">
                <span className="ficon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" />
                  </svg>
                </span>
                <h3>Encuentra eventos</h3>
                <p>¿Qué hay este fin de semana? Conciertos, ferias, expo y actividades: siempre al día.</p>
              </article>
              <article className="feature reveal">
                <span className="ficon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <h3>Explora lugares</h3>
                <p>Desde el Puente de la Historia hasta los rincones que solo los locales conocen.</p>
              </article>
              <article className="feature reveal">
                <span className="ficon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M4 9 5.2 4.5h13.6L20 9M4 9v10.5h16V9M4 9h16M9 19.5V14h6v5.5" />
                  </svg>
                </span>
                <h3>Apoya comercios locales</h3>
                <p>Restaurantes, tiendas y servicios de San Juan. Encuentra y apoya lo de aquí.</p>
              </article>
              <article className="feature reveal">
                <span className="ficon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <h3>Resuelve tu día</h3>
                <p>Teléfonos, direcciones, horarios y datos prácticos que necesitas ya.</p>
              </article>
              <article className="feature reveal">
                <span className="ficon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M9 4 4 6.5v13L9 17l6 2.5 5-2.5v-13L15 6.5 9 4Z" /><path d="M9 4v13M15 6.5v13" />
                  </svg>
                </span>
                <h3>Sigue rutas</h3>
                <p>Recorridos culturales, gastronómicos y familiares listos para caminar.</p>
              </article>
              <article className="feature reveal">
                <span className="ficon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M4 19.5V6a2 2 0 0 1 2-2h6v16H6a2 2 0 0 0-2 1.5Z" />
                    <path d="M20 19.5V6a2 2 0 0 0-2-2h-6v16h6a2 2 0 0 1 2 1.5Z" />
                  </svg>
                </span>
                <h3>Conoce la historia</h3>
                <p>Lo que hace única a San Juan, contado de forma breve y con orgullo.</p>
              </article>
            </div>
          </div>
        </section>

        {/* MUY PRONTO */}
        <section className="section band--soft" id="pronto" aria-label="Muy pronto">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">En camino</span>
              <h2>Esto se pone mejor</h2>
              <p className="lead">Empezamos con la Feria, pero hay mucho más en camino. Sé de los primeros en enterarte.</p>
            </div>
            <div className="soon-grid">
              <div className="soon reveal"><span className="n">01</span><span className="label">Lugares para visitar</span><span className="chip">Pronto</span></div>
              <div className="soon reveal"><span className="n">02</span><span className="label">Eventos de la ciudad</span><span className="chip">Pronto</span></div>
              <div className="soon reveal"><span className="n">03</span><span className="label">Guía de comercios locales</span><span className="chip">Pronto</span></div>
              <div className="soon reveal"><span className="n">04</span><span className="label">Recomendaciones familiares</span><span className="chip">Pronto</span></div>
              <div className="soon reveal"><span className="n">05</span><span className="label">Rutas culturales</span><span className="chip">Pronto</span></div>
              <div className="soon reveal"><span className="n">06</span><span className="label">Espacios para negocios sanjuanenses</span><span className="chip">Pronto</span></div>
            </div>
            <p className="soon-note reveal">
              <span className="pulse"></span> Estamos construyendo esta guía paso a paso. La Feria San Juan 2026 es el primer capítulo.
            </p>
            <ProposalModal />
          </div>
        </section>

        {/* EMOCIONAL */}
        <section className="section band--deep on-deep" aria-label="San Juan merece una guía a su altura">
          <div className="wrap">
            <div className="emotive reveal">
              <span className="eyebrow">Hecho aquí</span>
              <h2>Información útil, hecha con cariño</h2>
              <p>
                Una herramienta digital para San Juan. Esta guía existe para que encuentres lo
                que buscas sin complicaciones — y para que la ciudad se sienta más conectada.
              </p>
              <p className="pullquote">Práctica, bonita y <span>hecha por gente de aquí.</span></p>
            </div>
          </div>
        </section>

        {/* INDEPENDENCIA + TRINIUM */}
        <section className="section" id="trinium" aria-label="Sobre Guía San Juan">
          <div className="wrap">
            <div className="indie reveal">
              <span className="shield" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 3 5 6v5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z" />
                  <path d="m9 11.5 2 2 4-4" />
                </svg>
              </span>
              <div>
                <h3>Iniciativa independiente</h3>
                <p>
                  Guía San Juan es una iniciativa independiente creada por Trinium. No somos un sitio oficial.
                  Nuestro objetivo es acercar información útil, clara y accesible para habitantes, visitantes y negocios de San Juan del Río.
                </p>
              </div>
            </div>

            <div className="signature reveal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="trinium-logo-img"
                src="/assets/trinium-logo.png"
                alt="Trinium"
                width={1527}
                height={597}
              />
              <p>
                Guía San Juan es un proyecto de <a href="https://trinium.com.mx" target="_blank" rel="noopener noreferrer"><b>Trinium.</b></a>
                Creamos sitios web, software y soluciones digitales con corazón.
              </p>
              <a
                className="sig-link sig-link--wa"
                href="https://wa.me/524271000100?text=Hola%2C%20vi%20Gu%C3%ADa%20San%20Juan%20y%20me%20interesa%20una%20p%C3%A1gina%20similar%20para%20mi%20negocio."
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.1 1.523 5.82L.057 23.053c-.112.383.238.733.62.62l5.228-1.466A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0"/>
                </svg>
                ¿Quieres una página como esta? Escríbenos <span className="arrow">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer" aria-label="Pie de página">
        <div className="wrap">
          <div className="footer-top">
            <div className="footer-brand">
              <a className="brand" href="#top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo-GS.png" alt="" className="brand-logo" width={38} height={38} />
                <span>
                  <span className="brand-name">Guía San Juan</span>
                  <span className="brand-sub">San Juan del Río, Qro.</span>
                </span>
              </a>
              <p className="footer-blurb">
                Una guía digital independiente para descubrir, vivir y conectar con San Juan del Río.
                Empezamos con la Feria 2026 y seguimos creciendo, paso a paso.
              </p>
            </div>
            <div className="footer-col">
              <h4>Explora</h4>
              <ul>
                <li><a href="https://guiaferiasjr.vercel.app">Feria San Juan 2026</a></li>
                <li><a href="#proyecto">El proyecto</a></li>
                <li><a href="#pronto">Muy pronto</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contacto</h4>
              <ul>
                <li><a href="mailto:hola@trinium.mx">hola@trinium.mx</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>No somos sitio oficial del Ayuntamiento ni del Patronato de Feria. Iniciativa independiente creada por Trinium.</p>
            <span className="made">© 2026 Guía San Juan · Hecho con 💙 por <b>Trinium</b></span>
          </div>
        </div>
      </footer>
    </>
  );
}
