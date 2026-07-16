# Respaldo, restauración y rotación de llaves

Runbook de operaciones de guiasanjuan.mx (proyecto Supabase de **contenido**).
Cubre TRI-216 y la prueba de aceptación **M17-10** (PLAN.md §5.1 / §5.2).

> El proyecto **transaccional** de la Fase 2 (datos personales de gestoría) tendrá su
> propio runbook con retención por categoría (PLAN.md §1.2/§5.3). Este documento es
> solo para el proyecto de contenido.

---

## 1. Qué se respalda

| Componente | Fuente de verdad | Cómo se respalda |
|---|---|---|
| **Esquema** (tablas, RLS, políticas, triggers) | `supabase/migrations/*.sql` en git | Ya versionado; el repo ES el respaldo del esquema |
| **Datos** (filas de todas las tablas públicas) | Base Supabase | `scripts/respaldo.mjs` → `respaldos/<timestamp>/` |
| **Objetos de Storage** (bucket `propuestas`) | Supabase Storage | Ver §5 (pendiente de automatizar) |
| **Usuarios de Auth** (`auth.users`) | Supabase Auth | Export del dashboard / API admin (ver §5) |

`respaldos/` está en `.gitignore`: los datos incluyen **datos personales** (p. ej. emails en
`propuestas`) y **nunca** deben llegar al repositorio.

---

## 2. Tomar un respaldo

```bash
node scripts/respaldo.mjs        # o: pnpm respaldo
```

Requiere `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.
Descubre las tablas públicas vía PostgREST (refleja el esquema real, incluye tablas nuevas
automáticamente), exporta cada una a JSON y escribe `manifest.json` con conteo y `sha256`
por tabla.

**Calendario recomendado:** semanal mientras el contenido crece poco; diario al entrar en
producción con edición activa (Fase 1B). Puede automatizarse con un cron de Vercel o una
tarea programada; conservar los últimos N respaldos y purgar los viejos.

> Nota de fidelidad: `supabase db dump` produciría un dump SQL nativo, pero **requiere Docker**
> (no disponible en la máquina de operación actual). El export por PostgREST + service role
> es equivalente a nivel de datos y sin dependencias; el esquema se restaura desde las
> migraciones versionadas.

---

## 3. Prueba de restauración (M17-10)

```bash
node scripts/probar-restauracion.mjs        # o: pnpm probar-restauracion
```

Carga el respaldo más reciente en un **Postgres real aislado** (PGlite, en proceso, sin Docker),
inserta cada fila y la recupera, comparando el contenido contra el origen (deep-equal insensible
al orden de claves) y los conteos contra el `manifest`. Falla con código ≠ 0 si algo no cuadra.

**Última ejecución — 2026-07-16:** `7/7 tablas restauradas y verificadas` (395 filas:
admin_usuarios 1, admin_bitacora 0, propuestas 1, propuestas_intentos 0, documents 23,
events 82, n8n_chat_histories 288). Esto acredita M17-10 a nivel de datos: el respaldo es
**restaurable de verdad**, no solo "configurado".

**Alcance:** esta prueba valida la integridad y recuperabilidad de los **datos**. La
restauración de **esquema** se ejerce en el simulacro de DR completo (§4), que reconstruye
la base desde las migraciones.

---

## 4. Restauración real / simulacro de recuperación ante desastres

Para reconstruir el proyecto de contenido en una base nueva (Supabase nuevo o base local):

1. **Esquema:** aplicar las migraciones en orden.
   ```bash
   supabase db push --db-url "postgresql://postgres.<REF>:<PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
   ```
   (El host directo `db.<ref>.supabase.co` es IPv6-only; usar el **session pooler** `aws-1-...:5432`.)
2. **Datos:** reimportar cada `respaldos/<timestamp>/<tabla>.json` con la service role del
   proyecto destino (mismo mecanismo que `scripts/respaldo.mjs`, en sentido inverso: `insert`).
   Respetar el orden de dependencias (primero tablas sin FK).
3. **Storage:** volver a subir los objetos del bucket (§5).
4. **Auth:** reimportar usuarios si el proyecto es nuevo (§5); si solo se restaura la base de
   contenido, `admin_usuarios.id` debe seguir apuntando a `auth.users` existentes.
5. Verificar con `scripts/probar-restauracion.mjs` contra un respaldo del proyecto restaurado.

**Simulacro completo pendiente (recomendado, requiere infra del usuario):** ejecutar los pasos
1–5 contra un **proyecto Supabase de prueba** o un Postgres con Docker, una vez, y anotar el
tiempo de recuperación. Es el único paso que necesita un segundo proyecto o Docker.

---

## 5. Pendientes de automatizar

- [ ] Export de objetos de Storage (bucket `propuestas`) — hoy son pocos y públicos; scriptear al crecer.
- [ ] Export de `auth.users` vía API admin (`listUsers`) para DR de cuenta completa.
- [ ] Cron del respaldo + política de retención de respaldos (purga de los viejos).

---

## 6. Rotación de la service role key

La service role key **omite RLS**: su fuga compromete toda la base. Rotarla ante sospecha de
exposición y de forma periódica.

> ⚠️ **Operación sensible:** al rotar, la app en producción deja de autenticar hasta que se
> actualice la variable en Vercel y en `.env.local`. Hacerlo en ventana de mantenimiento.
> **No ejecutar como parte de un flujo automatizado sin confirmación.**

Supabase ofrece dos caminos según el esquema de llaves del proyecto:

**A. Llaves API nuevas (publishable / secret) — recomendado si está disponible:**
1. Dashboard → **Project Settings → API Keys**.
2. Crear una nueva **secret key**, desplegarla, y luego **revocar** la anterior (permite rotación sin caída).
3. Actualizar `SUPABASE_SERVICE_ROLE_KEY` en Vercel (todos los entornos) y en `.env.local`.
4. Redeploy en Vercel. Verificar `/admin` y el envío de propuestas.

**B. Rotación del JWT secret (esquema clásico `service_role`/`anon`):**
1. Dashboard → **Project Settings → API → JWT Settings → Rotate secret**.
2. ⚠️ Rota **también** la `anon` key y **invalida todas las sesiones** activas.
3. Actualizar en Vercel **y** en `.env.local`: `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Redeploy. Los admins deberán volver a iniciar sesión.

Tras cualquier rotación: confirmar que la llave vieja quedó **revocada** (una petición con ella
debe fallar) y registrar fecha y motivo.

**Simulacro de rotación pendiente (usuario):** ejecutar una vez el camino A o B en ventana de
mantenimiento para cronometrar y validar el procedimiento.

---

## 7. Continuidad editorial

- El **esquema** vive en git (`supabase/migrations/`): reconstruible sin la base viva.
- Los **datos verificados** (fuentes, verificaciones por grupo, historial) se respaldan con
  el mismo script cuando el modelo §2.2 se migre (Fase 1B). Mientras tanto, la investigación
  editorial vive en la plantilla de proveniencia (PLAN.md §2.2) — también fuera de la base viva.
- Responsable de respaldos y de correr la prueba de restauración: **definir nominalmente**
  (PLAN.md §8, "Responsable de verificación").
