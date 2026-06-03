import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Guía San Juan — Descubre San Juan del Río en un solo lugar',
  description:
    'Guía San Juan es una iniciativa digital independiente para descubrir eventos, lugares, servicios y negocios de San Juan del Río. Empezamos con la Feria San Juan 2026.',
  icons: {
    icon: '/assets/logo-GS.png',
    apple: '/assets/logo-GS.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-color="azul" data-mood="luminoso" data-font="sans" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">{`
          document.documentElement.className += ' reveal-on';
          var _mood = localStorage.getItem('gsj-mood');
          if (_mood) document.documentElement.setAttribute('data-mood', _mood);
        `}</Script>
        {children}
      </body>
    </html>
  );
}
