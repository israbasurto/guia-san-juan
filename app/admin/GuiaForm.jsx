'use client';
import { useActionState } from 'react';
import { crearGuia, actualizarGuia } from './contenido-actions';

export default function GuiaForm({ guia }) {
  const editar = !!guia;
  const [state, action, pending] = useActionState(editar ? actualizarGuia : crearGuia, null);

  return (
    <form action={action} className="pf-form">
      {editar && <input type="hidden" name="id" value={guia.id} />}
      <div className="pf-row">
        <label className="pf-label" htmlFor="g-titulo">Título</label>
        <input id="g-titulo" name="titulo" className="pf-field" defaultValue={guia?.titulo || ''} maxLength={200} required />
      </div>
      {!editar && (
        <div className="pf-row">
          <label className="pf-label" htmlFor="g-slug">Slug (opcional)</label>
          <input id="g-slug" name="slug" className="pf-field" placeholder="se genera del título" />
        </div>
      )}
      {editar && (
        <>
          <div className="pf-row">
            <label className="pf-label" htmlFor="g-resumen">Resumen</label>
            <input id="g-resumen" name="resumen" className="pf-field" defaultValue={guia.resumen || ''} />
          </div>
          <div className="pf-row">
            <label className="pf-label" htmlFor="g-cont">Contenido (Markdown)</label>
            <textarea id="g-cont" name="contenido_md" className="pf-field pf-textarea" defaultValue={guia.contenido_md || ''} rows={12} />
          </div>
        </>
      )}
      {state?.error && <p className="pf-file-err">{state.error}</p>}
      {state?.ok && <p className="admin-ok">✓ Guardado.</p>}
      <div className="pf-footer">
        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? 'Guardando…' : editar ? 'Guardar cambios' : 'Crear guía'}
        </button>
      </div>
    </form>
  );
}
