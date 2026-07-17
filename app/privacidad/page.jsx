import FichaShell from '../../components/FichaShell';

export const metadata = {
  title: 'Aviso de privacidad',
  description: 'Aviso de privacidad de Guía San Juan conforme a la LFPDPPP 2025.',
  alternates: { canonical: '/privacidad' },
};

// Versión 1 del aviso del SITIO INFORMATIVO. El servicio de gestoría (futuro)
// tendrá su propio aviso con revisión jurídica antes de recibir documentos.
export default function PrivacidadPage() {
  return (
    <FichaShell>
      <article className="wrap ficha legal">
        <nav className="ficha-crumbs" aria-label="Ruta"><a href="/">Inicio</a> › <span>Aviso de privacidad</span></nav>
        <h1 className="ficha-h1">Aviso de privacidad</h1>
        <p className="admin-muted" style={{ fontSize: 14 }}>Versión 1 · vigente desde julio de 2026</p>

        <p className="ficha-resumen">
          Este aviso corresponde al <b>sitio informativo</b> Guía San Juan. Un futuro servicio de
          gestoría, cuando exista, tendrá su propio aviso con revisión jurídica antes de recibir
          cualquier documento.
        </p>

        <section className="ficha-sec">
          <h2>1. Responsable</h2>
          <p>
            <b>Trinium</b> es responsable del tratamiento de tus datos personales a través del proyecto
            Guía San Juan (guiasanjuan.mx). Guía San Juan es un proyecto de Trinium, independiente del
            Gobierno Municipal y de las dependencias públicas mencionadas; no es un sitio oficial.
            Contacto: <a href="mailto:hola@trinium.mx">hola@trinium.mx</a>.
          </p>
        </section>

        <section className="ficha-sec">
          <h2>2. Qué datos recabamos y para qué</h2>
          <p>La única captura de datos del sitio es el <b>formulario de propuestas</b> (“Envía tu propuesta”):</p>
          <ul className="ficha-checklist">
            <li><b>Sobre el lugar o evento propuesto</b> (obligatorios): categoría, nombre y descripción. No son datos personales.</li>
            <li><b>Tus datos</b> (opcionales): tu nombre, tu correo electrónico y las imágenes que decidas adjuntar.</li>
          </ul>
          <p>
            <b>Finalidad:</b> revisar la propuesta y, en su caso, publicarla en la guía. Tu correo se usa
            <b> únicamente</b> para avisarte el resultado si lo dejaste; no lo usamos para publicidad ni lo
            compartimos.
          </p>
          <p>
            También medimos el uso del sitio con <b>Vercel Analytics</b> de forma <b>agregada y sin cookies</b>
            (no te identifica). Si usas el botón de <b>WhatsApp</b>, esa conversación ocurre en la plataforma de
            Meta y se rige por sus propias políticas (ver transferencias).
          </p>
        </section>

        <section className="ficha-sec">
          <h2>3. Encargados y transferencias</h2>
          <p>Para operar el sitio usamos proveedores que tratan datos por nuestra cuenta o reciben ciertos datos:</p>
          <ul className="ficha-checklist">
            <li><b>Supabase</b> — base de datos y almacenamiento de las propuestas.</li>
            <li><b>Vercel</b> — hospedaje del sitio y analítica agregada sin cookies.</li>
            <li><b>Meta / WhatsApp</b> — si inicias una conversación por WhatsApp, se transfiere a Meta.</li>
          </ul>
          <p>No vendemos ni rentamos tus datos personales.</p>
        </section>

        <section className="ficha-sec">
          <h2>4. Conservación</h2>
          <ul className="ficha-checklist">
            <li>Propuestas <b>rechazadas</b>: se eliminan a los <b>6 meses</b>.</li>
            <li>Registros técnicos anti-spam (un <b>hash</b> de tu IP, no la IP): se eliminan a los <b>30 días</b>.</li>
            <li>Propuestas <b>publicadas</b>: la información del lugar permanece como parte del contenido de la guía; tus datos de contacto no se publican.</li>
          </ul>
        </section>

        <section className="ficha-sec">
          <h2>5. Tus derechos (ARCO)</h2>
          <p>
            Puedes solicitar el <b>acceso, rectificación, cancelación u oposición</b> al tratamiento de tus
            datos, así como revocar tu consentimiento, escribiendo a <a href="mailto:hola@trinium.mx">hola@trinium.mx</a>.
            Atenderemos tu solicitud conforme a la Ley Federal de Protección de Datos Personales en Posesión de
            los Particulares (LFPDPPP, 2025).
          </p>
        </section>

        <section className="ficha-sec">
          <h2>6. Cambios a este aviso</h2>
          <p>
            Podemos actualizar este aviso. La versión vigente siempre estará publicada en esta página con su
            número de versión y fecha.
          </p>
        </section>
      </article>
    </FichaShell>
  );
}
