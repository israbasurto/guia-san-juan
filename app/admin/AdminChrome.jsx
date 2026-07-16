import AdminNav from './AdminNav';
import { logoutAction } from './actions';

// Chrome compartido de las páginas autenticadas del panel (NO envuelve /admin/login).
export default function AdminChrome({ children }) {
  return (
    <div className="admin-wrap">
      <header className="admin-header" id="adminHeader">
        <div className="admin-header-brand">
          <span className="brand-mark" style={{ width: 36, height: 36, fontSize: 17 }}>G</span>
          <span className="admin-header-title">
            Guía San Juan <span>· Admin</span>
          </span>
        </div>
        <AdminNav />
        <form action={logoutAction}>
          <button className="admin-logout" type="submit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Cerrar sesión
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
