'use client';
import { useActionState } from 'react';
import { cambiarCtaTramite } from './contenido-actions';

const CTA = ['oculto', 'proximamente', 'activo'];

export default function CtaControl({ id, cta_estado }) {
  const [state, formAction, pending] = useActionState(cambiarCtaTramite, null);
  return (
    <form action={formAction} className="admin-inline">
      <input type="hidden" name="id" value={id} />
      <select name="cta_estado" defaultValue={cta_estado} className="pf-field" style={{ maxWidth: 200 }}>
        {CTA.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <button className="btn btn--ghost" type="submit" disabled={pending}>{pending ? '…' : 'Cambiar CTA'}</button>
      {state?.error && <p className="pf-file-err" style={{ margin: 0 }}>{state.error}</p>}
      {state?.ok && <span className="admin-ok">✓</span>}
    </form>
  );
}
