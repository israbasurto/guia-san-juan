'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '../../lib/supabase-server';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { requireAdmin, registrarBitacora } from '../../lib/auth';

const ESTADOS_VALIDOS = ['pendiente', 'aprobada', 'rechazada'];

export async function loginAction(prevState, formData) {
  const email    = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Credenciales incorrectas' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) return { error: 'Demasiados intentos. Espera unos minutos.' };
    // Mensaje genérico: no distinguir si falló el usuario o la contraseña
    return { error: 'Credenciales incorrectas' };
  }
  redirect('/admin');
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();
  // signOut revoca el refresh token en el servidor de Auth (M17-8)
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function updateEstado(id, estado) {
  const { admin } = await requireAdmin({ escritura: true });

  if (!ESTADOS_VALIDOS.includes(estado)) throw new Error('Estado inválido');

  const { error } = await supabaseAdmin
    .from('propuestas')
    .update({ estado })
    .eq('id', id);
  if (error) throw error;

  await registrarBitacora(admin.id, 'actualizar_estado', 'propuestas', id, { estado });
  revalidatePath('/admin');
}
