import { createSupabaseServer } from './supabase-server';
import { supabaseAdmin } from './supabase-admin';

// Barrera real de autorización (M17-4): el middleware solo redirige; toda server
// action y route handler que escriba debe pasar por aquí, porque el service role
// omite RLS. getUser() valida la sesión contra el servidor de Auth, no solo el JWT.
export async function requireAdmin({ escritura = false } = {}) {
  const supabase = await createSupabaseServer();
  const { data: { user } = {}, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('No autorizado');

  // B9: la identidad autenticada y el registro administrativo son la misma fila
  const { data: admin } = await supabaseAdmin
    .from('admin_usuarios')
    .select('id, nombre, email, rol, activo')
    .eq('id', user.id)
    .single();

  if (!admin || !admin.activo) throw new Error('No autorizado');
  if (escritura && !['editor', 'admin'].includes(admin.rol)) throw new Error('No autorizado');

  return { user, admin };
}

// Bitácora de cambios administrativos: quién hizo qué y cuándo (M17-7)
export async function registrarBitacora(adminId, accion, entidad, entidadId, detalle = null) {
  const { error } = await supabaseAdmin.from('admin_bitacora').insert({
    admin_id:   adminId,
    accion,
    entidad,
    entidad_id: entidadId != null ? String(entidadId) : null,
    detalle,
  });
  if (error) throw error;
}
