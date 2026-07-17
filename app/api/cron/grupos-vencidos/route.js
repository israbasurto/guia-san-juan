import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { calcularCola } from '../../../../lib/cola-verificacion';

// Cron semanal (§3.4): arma la cola de grupos vencidos/invalidados y devuelve el
// resumen. Vercel Cron envía `Authorization: Bearer <CRON_SECRET>` cuando la env
// CRON_SECRET está definida; exigimos que coincida.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  const cola = await calcularCola(supabaseAdmin);
  const resumen = {
    generado_en: new Date().toISOString(),
    total: cola.total,
    vencidos: cola.vencidos.length,
    invalidados: cola.invalidados.length,
    // detalle acotado para el resumen
    detalle: [...cola.invalidados, ...cola.vencidos].slice(0, 50)
      .map((it) => ({ tipo: it.tipo, id: it.id, grupo: it.grupo, motivo: it.motivo, dias: it.dias })),
  };

  // Extensible: aquí se enviaría el resumen por correo/Slack al equipo editorial.
  console.log(`[cron grupos-vencidos] total=${resumen.total} vencidos=${resumen.vencidos} invalidados=${resumen.invalidados}`);

  return Response.json(resumen);
}
