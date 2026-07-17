'use client';
import { usePathname } from 'next/navigation';

const SECCIONES = [
  { href: '/admin', label: 'Propuestas' },
  { href: '/admin/dependencias', label: 'Dependencias' },
  { href: '/admin/tramites', label: 'Trámites' },
  { href: '/admin/directorio', label: 'Directorio' },
  { href: '/admin/guias', label: 'Guías' },
  { href: '/admin/verificacion', label: 'Verificación' },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admin-nav" aria-label="Secciones del panel">
      {SECCIONES.map((sec) => {
        const activo = sec.href === '/admin' ? path === '/admin' : path.startsWith(sec.href);
        return (
          <a key={sec.href} href={sec.href} className={`admin-nav-link${activo ? ' active' : ''}`}>
            {sec.label}
          </a>
        );
      })}
    </nav>
  );
}
