'use client';
import { useActionState } from 'react';
import { cambiarEstadoDependencia, cambiarEstadoTramite } from './contenido-actions';

const ESTADOS = ['borrador', 'en_revision', 'publicado', 'vencido', 'retirado'];

export default function EstadoControl({ tipo, id, estado }) {
  const action = tipo === 'tramite' ? cambiarEstadoTramite : cambiarEstadoDependencia;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="admin-inline">
      <input type="hidden" name="id" value={id} />
      <select name="estado" defaultValue={estado} className="pf-field" style={{ maxWidth: 200 }}>
        {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
      <button className="btn btn--ghost" type="submit" disabled={pending}>{pending ? '…' : 'Cambiar estado'}</button>
      {state?.error && <p className="pf-file-err" style={{ margin: 0 }}>{state.error}</p>}
      {state?.ok && <span className="admin-ok">✓</span>}
    </form>
  );
}
