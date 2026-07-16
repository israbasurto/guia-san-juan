'use client';
import { useActionState } from 'react';
import { crearDependencia, actualizarDependencia } from './contenido-actions';

export default function DependenciaForm({ dependencia }) {
  const editar = !!dependencia;
  const [state, action, pending] = useActionState(editar ? actualizarDependencia : crearDependencia, null);

  return (
    <form action={action} className="pf-form">
      {editar && <input type="hidden" name="id" value={dependencia.id} />}

      <div className="pf-row">
        <label className="pf-label" htmlFor="d-nombre">Nombre</label>
        <input id="d-nombre" name="nombre" className="pf-field" defaultValue={dependencia?.nombre || ''} maxLength={160} required />
      </div>

      {!editar && (
        <div className="pf-row">
          <label className="pf-label" htmlFor="d-slug">Slug (opcional)</label>
          <input id="d-slug" name="slug" className="pf-field" placeholder="se genera del nombre si lo dejas vacío" />
          <span className="pf-note">Minúsculas, sin acentos, con guiones. No cambia una vez publicado.</span>
        </div>
      )}

      <div className="pf-row">
        <label className="pf-label" htmlFor="d-desc">Descripción</label>
        <textarea id="d-desc" name="descripcion" className="pf-field pf-textarea" defaultValue={dependencia?.descripcion || ''} />
      </div>

      {editar && (
        <>
          <div className="pf-row">
            <label className="pf-label" htmlFor="d-dir">Dirección</label>
            <input id="d-dir" name="direccion" className="pf-field" defaultValue={dependencia.direccion || ''} />
          </div>
          <div className="pf-cols">
            <div className="pf-row">
              <label className="pf-label" htmlFor="d-lat">Latitud</label>
              <input id="d-lat" name="lat" className="pf-field" defaultValue={dependencia.lat ?? ''} inputMode="decimal" />
            </div>
            <div className="pf-row">
              <label className="pf-label" htmlFor="d-lng">Longitud</label>
              <input id="d-lng" name="lng" className="pf-field" defaultValue={dependencia.lng ?? ''} inputMode="decimal" />
            </div>
          </div>
          <div className="pf-row">
            <label className="pf-label" htmlFor="d-email">Email</label>
            <input id="d-email" name="email" type="email" className="pf-field" defaultValue={dependencia.email || ''} />
          </div>
          <div className="pf-row">
            <label className="pf-label" htmlFor="d-sitio">Sitio oficial</label>
            <input id="d-sitio" name="sitio_oficial_url" className="pf-field" defaultValue={dependencia.sitio_oficial_url || ''} />
          </div>
        </>
      )}

      {state?.error && <p className="pf-file-err">{state.error}</p>}
      {state?.ok && <p className="admin-ok">✓ Guardado.</p>}

      <div className="pf-footer">
        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? 'Guardando…' : editar ? 'Guardar cambios' : 'Crear dependencia'}
        </button>
      </div>
    </form>
  );
}
