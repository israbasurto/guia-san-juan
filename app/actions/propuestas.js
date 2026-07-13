'use server';
import { createHash, randomUUID } from 'crypto';
import { headers } from 'next/headers';
import { supabaseAdmin } from '../../lib/supabase-admin';

const CATEGORIAS = [
  '01 · Lugares para visitar',
  '02 · Eventos de la ciudad',
  '03 · Guía de comercios locales',
  '04 · Recomendaciones familiares',
  '05 · Rutas culturales',
  '06 · Espacios para negocios sanjuanenses',
];

const MAX_IMAGENES     = 5;
const MIME_EXT         = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const VENTANA_MINUTOS  = 60;
const MAX_POR_VENTANA  = 5;
const RUTA_VALIDA      = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

// Se guarda el hash de la IP, no la IP (minimización de datos, M16)
async function ipHash() {
  const h  = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida';
  return createHash('sha256').update(ip).digest('hex');
}

async function excedeLimite(hash) {
  const desde = new Date(Date.now() - VENTANA_MINUTOS * 60_000).toISOString();
  const { count, error } = await supabaseAdmin
    .from('propuestas_intentos')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', hash)
    .gte('creado_at', desde);
  if (error) throw error;
  return (count ?? 0) >= MAX_POR_VENTANA;
}

async function registrarIntento(hash) {
  await supabaseAdmin.from('propuestas_intentos').insert({ ip_hash: hash });
}

const ERROR_GENERICO = 'Hubo un problema al enviar tu propuesta. Intenta de nuevo.';
const ERROR_LIMITE   = 'Has enviado varias propuestas seguidas. Intenta de nuevo más tarde.';

// Las imágenes no viajan por la server action (límite de body en Vercel):
// el servidor emite URLs de subida firmadas de un solo uso, tras pasar el
// rate limit; el bucket impone tamaño máximo y tipos MIME permitidos.
export async function prepararSubidas(tipos) {
  if (!Array.isArray(tipos) || tipos.length === 0 || tipos.length > MAX_IMAGENES) {
    return { error: `Máximo ${MAX_IMAGENES} imágenes.` };
  }
  if (!tipos.every((t) => MIME_EXT[t])) {
    return { error: 'Solo se aceptan imágenes JPG, PNG o WebP.' };
  }

  const hash = await ipHash();
  if (await excedeLimite(hash)) return { error: ERROR_LIMITE };

  try {
    // Cada emisión de URLs consume un intento: sin esto se podrían
    // cosechar URLs firmadas sin límite y llenar el bucket
    await registrarIntento(hash);

    const subidas = [];
    for (const tipo of tipos) {
      const path = `${randomUUID()}.${MIME_EXT[tipo]}`;
      const { data, error } = await supabaseAdmin.storage
        .from('propuestas')
        .createSignedUploadUrl(path);
      if (error) throw error;
      subidas.push({ path: data.path, token: data.token });
    }
    return { subidas };
  } catch (err) {
    console.error(err);
    return { error: ERROR_GENERICO };
  }
}

export async function enviarPropuesta(formData, rutasImagenes = []) {
  // Honeypot: los bots lo llenan, las personas no lo ven. Éxito silencioso.
  if (formData.get('sitio_web')) return { ok: true };

  const categoria   = String(formData.get('categoria') || '').trim();
  const nombre      = String(formData.get('nombre') || '').trim();
  const descripcion = String(formData.get('descripcion') || '').trim();
  const proponente  = String(formData.get('proponente') || '').trim();
  const email       = String(formData.get('email') || '').trim();

  if (!CATEGORIAS.includes(categoria)) return { error: 'Elige una categoría válida.' };
  if (!nombre || nombre.length > 120) return { error: 'El nombre es obligatorio (máx. 120 caracteres).' };
  if (!descripcion || descripcion.length > 2000) return { error: 'La descripción es obligatoria (máx. 2000 caracteres).' };
  if (proponente.length > 120) return { error: 'Tu nombre no puede exceder 120 caracteres.' };
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: 'El email no es válido.' };
  }

  if (!Array.isArray(rutasImagenes) || rutasImagenes.length > MAX_IMAGENES) return { error: ERROR_GENERICO };
  if (!rutasImagenes.every((r) => typeof r === 'string' && RUTA_VALIDA.test(r))) return { error: ERROR_GENERICO };

  const hash = await ipHash();
  if (await excedeLimite(hash)) return { error: ERROR_LIMITE };

  try {
    await registrarIntento(hash);

    const imageUrls = rutasImagenes.map(
      (ruta) => supabaseAdmin.storage.from('propuestas').getPublicUrl(ruta).data.publicUrl
    );

    const { error } = await supabaseAdmin.from('propuestas').insert({
      categoria,
      nombre,
      descripcion,
      proponente: proponente || null,
      email:      email || null,
      imagenes:   imageUrls.length ? imageUrls : null,
    });
    if (error) throw error;

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: ERROR_GENERICO };
  }
}
