'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { requireAdmin, registrarBitacora } from '../../lib/auth';

const ESTADOS = ['borrador', 'en_revision', 'publicado', 'vencido', 'retirado'];
const CTA_ESTADOS = ['oculto', 'proximamente', 'activo'];
const GRUPOS_TRAMITE = ['requisitos', 'costos', 'contacto', 'ubicacion', 'horarios_propios', 'representacion'];
const GRUPOS_DEPENDENCIA = ['contacto', 'ubicacion', 'horarios'];
const RESULTADOS = ['confirmado', 'cambio_detectado', 'conflicto_entre_fuentes', 'no_localizable'];
const CATEGORIAS_COSTO = ['derecho', 'honorario', 'gasto', 'otro'];
const TIPOS_COSTO = ['fijo', 'rango', 'desde', 'desconocido'];
const FUENTE_TIPOS = ['web', 'telefono', 'presencial', 'documento_oficial'];

const s = (fd, k) => String(fd.get(k) ?? '').trim();
const nulo = (v) => (v === '' ? null : v);
const numero = (v) => (v === '' || v == null ? null : Number(v));

// Slug: minúsculas, sin acentos, guiones. Inmutable una vez publicado (se valida en UI).
function slugify(txt) {
  return txt.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function fuenteDesde(fd) {
  const url = s(fd, 'fuente_url');
  const tipo = s(fd, 'fuente_tipo') || 'web';
  if (!url && !s(fd, 'fuente_descripcion')) return null;
  if (!FUENTE_TIPOS.includes(tipo)) return null;
  const { data, error } = await supabaseAdmin.from('fuentes')
    .insert({ url: nulo(url), tipo, descripcion: nulo(s(fd, 'fuente_descripcion')) })
    .select('id').single();
  if (error) throw error;
  return data.id;
}

// ============================================================
// DEPENDENCIAS
// ============================================================
export async function crearDependencia(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const nombre = s(fd, 'nombre');
  if (!nombre || nombre.length > 160) return { error: 'El nombre es obligatorio (máx. 160).' };
  const slug = slugify(s(fd, 'slug') || nombre);
  if (!slug) return { error: 'No se pudo generar un slug válido.' };

  const { data, error } = await supabaseAdmin.from('dependencias')
    .insert({ nombre, slug, descripcion: nulo(s(fd, 'descripcion')) })
    .select('id').single();
  if (error) return { error: error.code === '23505' ? 'Ya existe una dependencia con ese slug.' : error.message };

  await registrarBitacora(admin.id, 'crear', 'dependencias', data.id, { nombre, slug });
  revalidatePath('/admin/dependencias');
  redirect(`/admin/dependencias/${data.id}`);
}

export async function actualizarDependencia(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const id = s(fd, 'id');
  const nombre = s(fd, 'nombre');
  if (!id) return { error: 'Falta el id.' };
  if (!nombre || nombre.length > 160) return { error: 'El nombre es obligatorio (máx. 160).' };

  const { error } = await supabaseAdmin.from('dependencias').update({
    nombre,
    descripcion: nulo(s(fd, 'descripcion')),
    direccion: nulo(s(fd, 'direccion')),
    lat: numero(s(fd, 'lat')), lng: numero(s(fd, 'lng')),
    email: nulo(s(fd, 'email')), sitio_oficial_url: nulo(s(fd, 'sitio_oficial_url')),
    actualizado_en: new Date().toISOString(),
  }).eq('id', id);
  if (error) return { error: error.message };

  await registrarBitacora(admin.id, 'actualizar', 'dependencias', id, null);
  revalidatePath(`/admin/dependencias/${id}`);
  return { ok: true };
}

export async function cambiarEstadoDependencia(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const id = s(fd, 'id'); const estado = s(fd, 'estado');
  if (!ESTADOS.includes(estado)) return { error: 'Estado inválido' };
  const { error } = await supabaseAdmin.from('dependencias').update({ estado }).eq('id', id);
  if (error) return { error: error.message };
  await registrarBitacora(admin.id, 'cambiar_estado', 'dependencias', id, { estado });
  revalidatePath(`/admin/dependencias/${id}`);
  revalidatePath('/admin/dependencias');
  return { ok: true };
}

export async function agregarTelefonoDependencia(fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const dependencia_id = s(fd, 'dependencia_id'); const numero_ = s(fd, 'numero');
  if (!dependencia_id || !numero_) throw new Error('Datos incompletos');
  const { error } = await supabaseAdmin.from('dependencia_telefonos').insert({
    dependencia_id, numero: numero_, etiqueta: nulo(s(fd, 'etiqueta')), extension: nulo(s(fd, 'extension')),
  });
  if (error) throw error;
  await registrarBitacora(admin.id, 'agregar_telefono', 'dependencias', dependencia_id, { numero: numero_ });
  revalidatePath(`/admin/dependencias/${dependencia_id}`);
}

export async function eliminarTelefonoDependencia(fd) {
  await requireAdmin({ escritura: true });
  const id = s(fd, 'id'); const dependencia_id = s(fd, 'dependencia_id');
  const { error } = await supabaseAdmin.from('dependencia_telefonos').delete().eq('id', id);
  if (error) throw error;
  revalidatePath(`/admin/dependencias/${dependencia_id}`);
}

export async function registrarVerificacionDependencia(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const dependencia_id = s(fd, 'dependencia_id');
  const grupo = s(fd, 'grupo'); const resultado = s(fd, 'resultado') || 'confirmado';
  if (!GRUPOS_DEPENDENCIA.includes(grupo)) return { error: 'Grupo inválido.' };
  if (!RESULTADOS.includes(resultado)) return { error: 'Resultado inválido.' };

  let fuente_id = null;
  try { fuente_id = await fuenteDesde(fd); } catch (e) { return { error: 'Fuente inválida: ' + e.message }; }

  const { error } = await supabaseAdmin.from('dependencia_verificaciones').insert({
    dependencia_id, grupo, resultado, fuente_id, notas: nulo(s(fd, 'notas')), verificado_por: admin.id,
  });
  if (error) return { error: error.message };
  await registrarBitacora(admin.id, 'verificar', 'dependencias', dependencia_id, { grupo, resultado });
  revalidatePath(`/admin/dependencias/${dependencia_id}`);
  return { ok: true };
}

// ============================================================
// TRÁMITES
// ============================================================
export async function crearTramite(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const nombre = s(fd, 'nombre');
  if (!nombre || nombre.length > 200) return { error: 'El nombre es obligatorio (máx. 200).' };
  const slug = slugify(s(fd, 'slug') || nombre);
  if (!slug) return { error: 'No se pudo generar un slug válido.' };

  const { data, error } = await supabaseAdmin.from('tramites')
    .insert({ nombre, slug, dependencia_id: nulo(s(fd, 'dependencia_id')) })
    .select('id').single();
  if (error) return { error: error.code === '23505' ? 'Ya existe un trámite con ese slug.' : error.message };

  await registrarBitacora(admin.id, 'crear', 'tramites', data.id, { nombre, slug });
  revalidatePath('/admin/tramites');
  redirect(`/admin/tramites/${data.id}`);
}

export async function actualizarTramite(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const id = s(fd, 'id');
  const nombre = s(fd, 'nombre');
  if (!id) return { error: 'Falta el id.' };
  if (!nombre) return { error: 'El nombre es obligatorio.' };

  // requisitos: una por línea → jsonb array
  const requisitos = s(fd, 'requisitos').split('\n').map((l) => l.trim()).filter(Boolean);
  const grupos_obligatorios = GRUPOS_TRAMITE.filter((g) => fd.get(`grupo_${g}`) === 'on');

  const { error } = await supabaseAdmin.from('tramites').update({
    nombre,
    resumen: nulo(s(fd, 'resumen')),
    descripcion_md: nulo(s(fd, 'descripcion_md')),
    dependencia_id: nulo(s(fd, 'dependencia_id')),
    categoria_id: nulo(s(fd, 'categoria_id')),
    tiempo_estimado: nulo(s(fd, 'tiempo_estimado')),
    requisitos: requisitos.length ? requisitos : null,
    grupos_obligatorios,
    actualizado_en: new Date().toISOString(),
  }).eq('id', id);
  if (error) return { error: error.message };

  await registrarBitacora(admin.id, 'actualizar', 'tramites', id, null);
  revalidatePath(`/admin/tramites/${id}`);
  return { ok: true };
}

export async function cambiarEstadoTramite(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const id = s(fd, 'id'); const estado = s(fd, 'estado');
  if (!ESTADOS.includes(estado)) return { error: 'Estado inválido' };

  // Puerta editorial (B8): publicar exige los grupos_obligatorios verificados y vigentes.
  if (estado === 'publicado') {
    const { data: t } = await supabaseAdmin.from('tramites').select('grupos_obligatorios').eq('id', id).single();
    const requeridos = t?.grupos_obligatorios ?? [];
    if (requeridos.length) {
      const { data: vers } = await supabaseAdmin.from('tramite_verificaciones')
        .select('grupo').eq('tramite_id', id).is('invalidada_en', null).eq('resultado', 'confirmado');
      const verificados = new Set((vers ?? []).map((v) => v.grupo));
      const faltan = requeridos.filter((g) => !verificados.has(g));
      if (faltan.length) return { error: `No se puede publicar: faltan verificar los grupos ${faltan.join(', ')}.` };
    }
  }

  const { error } = await supabaseAdmin.from('tramites').update({ estado }).eq('id', id);
  if (error) return { error: error.message };
  await registrarBitacora(admin.id, 'cambiar_estado', 'tramites', id, { estado });
  revalidatePath(`/admin/tramites/${id}`);
  revalidatePath('/admin/tramites');
  return { ok: true };
}

export async function cambiarCtaTramite(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const id = s(fd, 'id'); const cta_estado = s(fd, 'cta_estado');
  if (!CTA_ESTADOS.includes(cta_estado)) return { error: 'Estado de CTA inválido' };

  // Puerta comercial (B8/M11/M19): 'activo' exige representación aprobada (ambos controles)
  // y un honorario vigente en costos_tramite.
  if (cta_estado === 'activo') {
    const { data: rep } = await supabaseAdmin.from('representacion_tramite')
      .select('confirmacion_operativa_estado, revision_juridica_estado').eq('tramite_id', id).maybeSingle();
    const repOk = rep && rep.confirmacion_operativa_estado === 'confirmado' && rep.revision_juridica_estado === 'aprobada';
    const { count } = await supabaseAdmin.from('costos_tramite')
      .select('id', { count: 'exact', head: true }).eq('tramite_id', id).eq('categoria', 'honorario');
    if (!repOk) return { error: 'No se puede activar el CTA: la representación no está confirmada y aprobada (M11).' };
    if (!count) return { error: 'No se puede activar el CTA: falta un honorario en costos (M19).' };
  }

  const { error } = await supabaseAdmin.from('tramites').update({ cta_estado }).eq('id', id);
  if (error) return { error: error.message };
  await registrarBitacora(admin.id, 'cambiar_cta', 'tramites', id, { cta_estado });
  revalidatePath(`/admin/tramites/${id}`);
  return { ok: true };
}

export async function agregarCostoTramite(fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const tramite_id = s(fd, 'tramite_id');
  const concepto = s(fd, 'concepto');
  const categoria = s(fd, 'categoria'); const tipo = s(fd, 'tipo');
  if (!tramite_id || !concepto) throw new Error('Datos incompletos');
  if (!CATEGORIAS_COSTO.includes(categoria) || !TIPOS_COSTO.includes(tipo)) throw new Error('Categoría o tipo inválidos');
  const { error } = await supabaseAdmin.from('costos_tramite').insert({
    tramite_id, concepto, categoria, tipo,
    importe_min: numero(s(fd, 'importe_min')), importe_max: numero(s(fd, 'importe_max')),
    condiciones: nulo(s(fd, 'condiciones')),
  });
  if (error) throw error;
  await registrarBitacora(admin.id, 'agregar_costo', 'tramites', tramite_id, { concepto, categoria });
  revalidatePath(`/admin/tramites/${tramite_id}`);
}

export async function eliminarCostoTramite(fd) {
  await requireAdmin({ escritura: true });
  const id = s(fd, 'id'); const tramite_id = s(fd, 'tramite_id');
  const { error } = await supabaseAdmin.from('costos_tramite').delete().eq('id', id);
  if (error) throw error;
  revalidatePath(`/admin/tramites/${tramite_id}`);
}

export async function registrarVerificacionTramite(prevState, fd) {
  const { admin } = await requireAdmin({ escritura: true });
  const tramite_id = s(fd, 'tramite_id');
  const grupo = s(fd, 'grupo'); const resultado = s(fd, 'resultado') || 'confirmado';
  if (!GRUPOS_TRAMITE.includes(grupo)) return { error: 'Grupo inválido.' };
  if (!RESULTADOS.includes(resultado)) return { error: 'Resultado inválido.' };

  let fuente_id = null;
  try { fuente_id = await fuenteDesde(fd); } catch (e) { return { error: 'Fuente inválida: ' + e.message }; }

  const { error } = await supabaseAdmin.from('tramite_verificaciones').insert({
    tramite_id, grupo, resultado, fuente_id, notas: nulo(s(fd, 'notas')), verificado_por: admin.id,
  });
  if (error) return { error: error.message };
  await registrarBitacora(admin.id, 'verificar', 'tramites', tramite_id, { grupo, resultado });
  revalidatePath(`/admin/tramites/${tramite_id}`);
  return { ok: true };
}
