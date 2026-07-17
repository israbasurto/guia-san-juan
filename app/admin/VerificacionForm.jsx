'use client';
import { useActionState } from 'react';
import { registrarVerificacionDependencia, registrarVerificacionTramite, registrarVerificacionDirectorio } from './contenido-actions';

const RESULTADOS = ['confirmado', 'cambio_detectado', 'conflicto_entre_fuentes', 'no_localizable'];
const ACCIONES = {
  dependencia: registrarVerificacionDependencia,
  tramite: registrarVerificacionTramite,
  directorio: registrarVerificacionDirectorio,
};
const ID_FIELD = { dependencia: 'dependencia_id', tramite: 'tramite_id', directorio: 'directorio_id' };

// grupos: lista de grupos válidos para la entidad
export default function VerificacionForm({ tipo, id, grupos }) {
  const action = ACCIONES[tipo] ?? registrarVerificacionDependencia;
  const idField = ID_FIELD[tipo] ?? 'dependencia_id';
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="pf-form admin-verif-form">
      <input type="hidden" name={idField} value={id} />
      <div className="pf-cols">
        <div className="pf-row">
          <label className="pf-label">Grupo</label>
          <select name="grupo" className="pf-field" required>
            {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="pf-row">
          <label className="pf-label">Resultado</label>
          <select name="resultado" className="pf-field" defaultValue="confirmado">
            {RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="pf-cols">
        <div className="pf-row">
          <label className="pf-label">Fuente (URL)</label>
          <input name="fuente_url" className="pf-field" placeholder="https://…" />
        </div>
        <div className="pf-row">
          <label className="pf-label">Tipo de fuente</label>
          <select name="fuente_tipo" className="pf-field" defaultValue="web">
            <option value="web">web</option>
            <option value="telefono">telefono</option>
            <option value="presencial">presencial</option>
            <option value="documento_oficial">documento_oficial</option>
          </select>
        </div>
      </div>
      <div className="pf-row">
        <label className="pf-label">Notas</label>
        <input name="notas" className="pf-field" placeholder="qué se confirmó y cómo" />
      </div>
      {state?.error && <p className="pf-file-err">{state.error}</p>}
      {state?.ok && <p className="admin-ok">✓ Verificación registrada.</p>}
      <button className="btn btn--primary" type="submit" disabled={pending}>{pending ? 'Registrando…' : 'Registrar verificación'}</button>
    </form>
  );
}
