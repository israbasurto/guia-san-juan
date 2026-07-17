'use server';
import { supabaseAdmin } from '../lib/supabase-admin';

// Registra búsquedas SIN resultado para priorizar qué capturar (§4).
// Nunca datos personales: se normaliza, se acota y se descarta lo que parezca
// email/teléfono. Retención corta (job de purga futuro).
export async function registrarBusquedaSinResultado(consulta) {
  const q = String(consulta || '').trim().toLowerCase().slice(0, 80);
  if (q.length < 3) return;
  if (q.includes('@') || /\d{6,}/.test(q)) return; // descarta emails y secuencias tipo teléfono

  const norm = q.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  if (!norm) return;

  const { data } = await supabaseAdmin
    .from('busquedas_sin_resultado').select('id, veces').eq('consulta_normalizada', norm).maybeSingle();

  if (data) {
    await supabaseAdmin.from('busquedas_sin_resultado')
      .update({ veces: data.veces + 1, ultima_vez: new Date().toISOString() }).eq('id', data.id);
  } else {
    await supabaseAdmin.from('busquedas_sin_resultado').insert({ consulta_normalizada: norm });
  }
}
