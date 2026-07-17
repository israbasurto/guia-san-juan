'use client';
import { useActionState } from 'react';
import { crearDirectorio, actualizarDirectorio } from './contenido-actions';

export default function DirectorioForm({ registro }) {
  const editar = !!registro;
  const [state, action, pending] = useActionState(editar ? actualizarDirectorio : crearDirectorio, null);

  return (
    <form action={action} className="pf-form">
      {editar && <input type="hidden" name="id" value={registro.id} />}
      <div className="pf-row">
        <label className="pf-label" htmlFor="dir-nombre">Nombre</label>
        <input id="dir-nombre" name="nombre" className="pf-field" defaultValue={registro?.nombre || ''} maxLength={160} required />
      </div>
      <div className="pf-row">
        <label className="pf-label" htmlFor="dir-cat">Categoría</label>
        <input id="dir-cat" name="categoria" className="pf-field" defaultValue={registro?.categoria || ''} placeholder="ej. Salud, Seguridad, Servicios" />
      </div>
      {editar && (
        <div className="pf-row">
          <label className="pf-label" htmlFor="dir-dir">Dirección</label>
          <input id="dir-dir" name="direccion" className="pf-field" defaultValue={registro.direccion || ''} />
        </div>
      )}
      {state?.error && <p className="pf-file-err">{state.error}</p>}
      {state?.ok && <p className="admin-ok">✓ Guardado.</p>}
      <div className="pf-footer">
        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? 'Guardando…' : editar ? 'Guardar cambios' : 'Crear registro'}
        </button>
      </div>
    </form>
  );
}
