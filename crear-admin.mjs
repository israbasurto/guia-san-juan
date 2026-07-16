// Alta de un usuario administrador (TRI-214, PLAN.md §5.1 B9).
// Uso:  node crear-admin.mjs correo "contraseña" "Nombre" [rol]
// Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local o del entorno.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';

const [email, password, nombre, rol = 'admin'] = process.argv.slice(2);

if (!email || !password || !nombre) {
  console.error('Uso: node crear-admin.mjs correo "contraseña" "Nombre" [admin|editor]');
  process.exit(1);
}
if (!['admin', 'editor'].includes(rol)) {
  console.error(`Rol inválido "${rol}" — debe ser admin o editor.`);
  process.exit(1);
}

if (existsSync('.env.local')) {
  for (const linea of readFileSync('.env.local', 'utf8').split('\n')) {
    const i = linea.indexOf('=');
    if (i === -1 || linea.trimStart().startsWith('#')) continue;
    const clave = linea.slice(0, i).trim();
    if (!(clave in process.env)) process.env[clave] = linea.slice(i + 1).trim();
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local o entorno).');
  process.exit(1);
}

const supabase = createClient(url, serviceRole);

const { data: creado, error: errorAuth } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (errorAuth) {
  console.error('Error al crear el usuario en Auth:', errorAuth.message);
  process.exit(1);
}

const { error: errorFila } = await supabase.from('admin_usuarios').insert({
  id: creado.user.id,
  nombre,
  email,
  rol,
});
if (errorFila) {
  // Sin la fila en admin_usuarios el usuario no puede operar el admin: revertir.
  await supabase.auth.admin.deleteUser(creado.user.id);
  console.error('Error al registrar en admin_usuarios (usuario de Auth revertido):', errorFila.message);
  process.exit(1);
}

console.log(`Admin creado: ${nombre} <${email}> rol=${rol} id=${creado.user.id}`);
