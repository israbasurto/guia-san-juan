import Script from 'next/script';
import { Spectral, Hanken_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

// next/font: autohospedadas, sin <link> a Google, sin CLS. Exponen variables CSS
// que globals.css consume vía --font-display / --font-body.
const spectral = Spectral({
  subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'],
  variable: '--font-spectral', display: 'swap',
});
const hanken = Hanken_Grotesk({
  subsets: ['latin'], variable: '--font-hanken', display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guiasanjuan.mx';

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Guía San Juan — Descubre San Juan del Río, Querétaro',
    template: '%s | Guía San Juan',
  },
  description:
    'Descubre eventos, lugares, restaurantes y negocios en San Juan del Río, Querétaro. Tu guía digital independiente — lugares para visitar, eventos, comercios locales y más.',
  keywords: [
    'San Juan del Río',
    'San Juan del Río Querétaro',
    'qué hacer en San Juan del Río',
    'eventos San Juan del Río',
    'lugares San Juan del Río',
    'restaurantes San Juan del Río',
    'guía San Juan del Río',
    'Querétaro',
  ],
  authors:   [{ name: 'Trinium', url: 'https://trinium.com.mx' }],
  creator:   'Trinium',
  publisher: 'Trinium',

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    type:        'website',
    locale:      'es_MX',
    url:         SITE_URL,
    siteName:    'Guía San Juan',
    title:       'Guía San Juan — Descubre San Juan del Río, Querétaro',
    description: 'Descubre eventos, lugares, restaurantes y negocios en San Juan del Río, Querétaro. Tu guía digital independiente.',
    images: [
      {
        url:    '/assets/puente_san_juan.webp',
        width:  1200,
        height: 800,
        alt:    'Puente de la Historia — San Juan del Río, Querétaro',
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'Guía San Juan — San Juan del Río, Querétaro',
    description: 'Tu guía digital independiente para San Juan del Río, Querétaro.',
    images:      ['/assets/puente_san_juan.webp'],
  },

  icons: {
    icon:  '/assets/logo-GS.png',
    apple: '/assets/logo-GS.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-color="azul" data-mood="luminoso" data-font="sans" className={`${spectral.variable} ${hanken.variable}`} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">{`
          document.documentElement.className += ' reveal-on';
          var _mood = localStorage.getItem('gsj-mood');
          if (_mood) document.documentElement.setAttribute('data-mood', _mood);
        `}</Script>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
