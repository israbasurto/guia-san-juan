'use client';
import { useActionState } from 'react';
import { loginAction } from '../actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="brand-mark" style={{ width: 48, height: 48, fontSize: 22 }}>G</span>
          <span className="brand-name" style={{ fontSize: 21 }}>Guía San Juan</span>
          <span className="admin-login-eyebrow">Panel de administración</span>
        </div>

        <form action={action} className="admin-login-form">
          <div className="pf-row">
            <label className="pf-label" htmlFor="email" style={{ fontSize: 14 }}>Email</label>
            <input
              className="pf-field"
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className="pf-row">
            <label className="pf-label" htmlFor="password" style={{ fontSize: 14 }}>Contraseña</label>
            <input
              className="pf-field"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error && (
            <p className="pf-file-err" style={{ marginTop: 0 }}>{state.error}</p>
          )}
          <button
            className="btn btn--primary"
            type="submit"
            disabled={pending}
            style={{ justifyContent: 'center', marginTop: 4 }}
          >
            {pending ? 'Entrando…' : 'Entrar al panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
