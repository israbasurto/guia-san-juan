// Fuerza render dinámico en TODO /admin para que Next aplique el nonce del CSP
// (middleware.js) a sus scripts inline. Sin este passthrough, /admin/login sería
// estático y sus scripts inline quedarían sin nonce → bloqueados por el CSP estricto.
// No agrega UI (el chrome sigue en AdminChrome).
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }) {
  return children;
}
