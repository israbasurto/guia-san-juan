'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '../../lib/supabase-admin';

async function requireAdmin() {
  const store = await cookies();
  if (store.get('gsj-admin')?.value !== '1') throw new Error('No autorizado');
}

export async function loginAction(prevState, formData) {
  const password = formData.get('password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: 'Contraseña incorrecta' };
  }
  const store = await cookies();
  store.set('gsj-admin', '1', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });
  redirect('/admin');
}

export async function logoutAction() {
  const store = await cookies();
  store.delete('gsj-admin');
  redirect('/admin/login');
}

export async function updateEstado(id, estado) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('propuestas')
    .update({ estado })
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/admin');
}
