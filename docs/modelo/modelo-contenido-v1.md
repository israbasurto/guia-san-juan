# Modelo de contenido §2.2 — congelado v1

> **Versión 1 — 2026-07-16.** Cierra las 6 condiciones del NO GO a migraciones (PLAN.md §9)
> y **levanta la puerta**: con este diseño congelado ya se puede escribir la migración `0002`
> del contenido (Fase 1B). Este documento es la fuente del esquema; la migración se deriva de
> aquí, no al revés.
>
> Alcance: **diseño**. No se aplica ninguna migración con este documento.

## Estado de las 6 condiciones

| # | Condición | Estado | Dónde |
|---|---|---|---|
| B7 | `*_evidencias` con FK real, sin polimorfismo | ✅ este doc §4 |
| B9 | `admin_usuarios.id → auth.users.id` | ✅ migración `0001` | ya aplicada |
| B8 | Separación editorial / comercial (`cta_estado`, `grupos_obligatorios`) | ✅ este doc §3 y §5 |
| M19 | Sin `precio_honorarios` duplicado; única fuente `costos_tramite` | ✅ este doc §3 y §6 |
| M18 | Proyección pública sin puerta trasera + pruebas RLS | ✅ este doc §7 |
| M20 | Matriz de invalidación documentada | ✅ `matriz-invalidacion.md` v1 |

---

## 1. Convenciones (congeladas)

- **Sin relaciones polimórficas** (B5/B7): una tabla hija específica por entidad, con FK real.
  Nunca `entidad_tipo + entidad_id`.
- **Timestamps con zona** (`timestamptz`) para verificación/auditoría; `date` solo para vigencias
  editoriales (vigencia de costos, etc.).
- **Moneda explícita** (`char(3) default 'MXN'`) aunque hoy todo sea MXN.
- **Estado editorial** en toda entidad publicable (B2):
  `estado enum('borrador','en_revision','publicado','vencido','retirado')`.
- **Todo actor es FK real** a `admin_usuarios` (nunca texto libre): `verificado_por`,
  `confirmado_por`, `revisado_por`, `autor`.
- **Privadas por defecto** (sin política de lectura anónima): `fuentes`, `*_fuentes`,
  `*_verificaciones`, `*_evidencias`, `*_historial`, `*_reportes`, `admin_usuarios`.

Enums de grupo (congelados, de `matriz-invalidacion.md`):
- `tramite_verificaciones.grupo`: `requisitos | costos | contacto | ubicacion | horarios_propios | representacion`
- `dependencia_verificaciones.grupo`: `contacto | ubicacion | horarios`
- `directorio_verificaciones.grupo`: `contacto | ubicacion`

---

## 2. Entidades base y tablas hijas públicas

DDL de referencia (se pule al escribir la migración; los tipos y FKs son los definitivos):

```sql
create type estado_editorial as enum ('borrador','en_revision','publicado','vencido','retirado');

create table dependencias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  direccion text, lat numeric, lng numeric,
  email text, sitio_oficial_url text,
  estado estado_editorial not null default 'borrador',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table dependencia_horarios (
  id uuid primary key default gen_random_uuid(),
  dependencia_id uuid not null references dependencias(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  abre time not null, cierra time not null
);

create table dependencia_horarios_excepciones (
  id uuid primary key default gen_random_uuid(),
  dependencia_id uuid not null references dependencias(id) on delete cascade,
  fecha date not null, motivo text,
  cerrado boolean not null default true, abre time, cierra time
);

create table dependencia_telefonos (
  id uuid primary key default gen_random_uuid(),
  dependencia_id uuid not null references dependencias(id) on delete cascade,
  etiqueta text, numero text not null, extension text,
  confirmado boolean not null default false
);

create table categorias_tramite (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, nombre text not null, orden int not null default 0
);
```

`directorio` replica el patrón: `directorio`, `directorio_telefonos`, `directorio_fuentes`,
`directorio_verificaciones`, `directorio_evidencias`, `directorio_historial`, `directorio_reportes`.

---

## 3. Trámite — B8 y M19 en el esquema

```sql
create table tramites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null, resumen text, descripcion_md text,
  categoria_id uuid references categorias_tramite(id),
  dependencia_id uuid references dependencias(id),   -- cambiarlo dispara cascada (matriz, regla 6)
  requisitos jsonb, tiempo_estimado text,
  documentos jsonb, faqs jsonb,
  cta_estado enum_cta not null default 'oculto',     -- M5
  grupos_obligatorios text[] not null default '{}',  -- B8: grupos EDITORIALES exigidos por trámite
  estado estado_editorial not null default 'borrador',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
  -- M19: SIN precio_honorarios. El precio del CTA se deriva de costos_tramite.
);
-- enum_cta: ('oculto','proximamente','activo')

create table tramite_horarios (            -- M21: SOLO si el trámite tiene horarios propios
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references tramites(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  abre time not null, cierra time not null
);

create table costos_tramite (              -- M12+M19: ÚNICA fuente de verdad de TODO costo
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references tramites(id) on delete cascade,
  concepto text not null,
  categoria enum_costo not null,           -- ('derecho','honorario','gasto','otro')  (M19)
  tipo enum_costo_tipo not null,           -- ('fijo','rango','desde','desconocido')
  importe_min numeric, importe_max numeric, moneda char(3) not null default 'MXN',
  condiciones text,
  vigencia_inicio date, vigencia_fin date,
  fuente_id uuid references fuentes(id)
);

create table representacion_tramite (      -- M11: dos controles SEPARADOS
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references tramites(id) on delete cascade,
  jurisdiccion text, oficina text, tipo_solicitante text,
  tipo_representacion enum_repr not null,  -- ('no_aplica','carta_simple','notarial')
  fuente_normativa text, fecha_vigencia date, restricciones text, version int not null default 1,
  confirmacion_operativa_estado enum_conf_op not null default 'pendiente_de_confirmar',
  confirmado_por uuid references admin_usuarios(id), confirmado_en timestamptz,
  revision_juridica_estado enum_rev_jur not null default 'pendiente',
  revisado_por uuid references admin_usuarios(id), revisado_en timestamptz
  -- CTA 'activo' SOLO con ambos controles aprobados y vigentes.
  -- B8: esta tabla es PREPARACIÓN COMERCIAL — no bloquea publicar la ficha informativa.
);
```

---

## 4. B7 — Evidencias sin polimorfismo (FK real)

Una tabla de evidencias **por entidad**, cada una con FK a **su** tabla de verificación. Sin
`entidad_tipo`/`entidad_id`.

```sql
-- Verificación por grupo (B4). Patrón repetido: dependencia_verificaciones, directorio_verificaciones.
create table tramite_verificaciones (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references tramites(id) on delete cascade,
  grupo grupo_tramite not null,            -- enum §1
  valor_verificado jsonb,                  -- snapshot/hash del valor confirmado
  fuente_id uuid references fuentes(id),
  resultado enum_result not null,          -- ('confirmado','cambio_detectado','conflicto_entre_fuentes','no_localizable')
  invalidada_en timestamptz,               -- set por trigger de la matriz M20; NULL = vigente
  notas text,
  verificado_por uuid not null references admin_usuarios(id),
  verificado_en timestamptz not null default now()
);

-- B7: evidencias con FK REAL a la verificación específica (no polimórfico)
create table tramite_evidencias (
  id uuid primary key default gen_random_uuid(),
  verificacion_id uuid not null references tramite_verificaciones(id) on delete cascade,
  tipo enum_evid not null,                 -- ('captura','archivo_oficial','correo','nota_telefonica')
  clasificacion enum_clasif not null default 'interna',  -- ('interna','publicable')
  contiene_datos_personales boolean not null default false,  -- activa retención/acceso restringido (trigger)
  retener_hasta date, ruta_privada text
);
-- dependencia_evidencias → dependencia_verificaciones ; directorio_evidencias → directorio_verificaciones
```

Igual patrón FK-real para `*_historial` (autor → admin_usuarios) y `*_reportes`.

---

## 5. B8 — Puertas de publicación vs. CTA

Dos puertas **independientes**, derivadas de datos, nunca de un flag manual:

**Puerta editorial (publica la ficha):** `tramites.estado` puede pasar a `'publicado'` solo si
**cada grupo en `tramites.grupos_obligatorios`** tiene una verificación **vigente** (`invalidada_en`
IS NULL, `resultado='confirmado'`, no vencida). `grupos_obligatorios` es configurable por trámite
(hay trámites sin costo, 100% en línea, sin dependencia única). La representación **no** entra aquí.

**Puerta comercial (activa el CTA):** `cta_estado` solo llega a `'activo'` si, además:
- `representacion_tramite` con **ambos** controles vigentes (`confirmacion_operativa_estado='confirmado'`
  y `revision_juridica_estado='aprobada'`), y
- existe un `costos_tramite` `categoria='honorario'` vigente (el precio, §6), y
- términos + canal seguro aprobados (Fase 2).

Invalidar un grupo **comercial** no despublica la ficha; invalidar uno **editorial** no toca el CTA
(la separación de la matriz M20, reglas 3 y 5).

---

## 6. M19 — Honorarios sin duplicar

- No existe `tramites.precio_honorarios`.
- El precio que muestra el CTA se **deriva** de la fila `costos_tramite` con `categoria='honorario'`
  y vigencia actual (`vigencia_inicio <= today` y `vigencia_fin` nula o futura).
- Si hay varias filas honorario vigentes → es un error de datos (constraint/validación en el CRUD:
  máximo una honorario vigente por trámite).
- El total de la ficha se muestra como **estimación** cuando hay rangos o variables (`tipo` in
  `rango|desde|desconocido`).

---

## 7. M18 — Proyección pública sin puerta trasera

**Problema.** Las tablas `*_verificaciones` son privadas (sin lectura anónima), pero la ficha debe
mostrar la **fecha** de verificación por grupo (M24). Una vista `security_invoker` sobre las tablas
privadas devolvería **0 filas** a un usuario anónimo (hereda su RLS, que no le da acceso). Una vista
`security_definer` sí leería, pero sería exactamente la **puerta trasera** que M18 prohíbe (correría
con privilegios que omiten RLS y podría filtrar columnas sensibles).

**Solución (equivalente a security_invoker, sin backdoor): tabla de proyección dedicada.**

```sql
create table verificacion_publica (
  entidad_tipo text not null check (entidad_tipo in ('tramite','dependencia','directorio')),
  entidad_id uuid not null,          -- id público de la entidad
  grupo text not null,
  fecha date not null,               -- verificado_en::date del grupo vigente
  primary key (entidad_tipo, entidad_id, grupo)
);
```

- Contiene **solo** columnas seguras: entidad, grupo, fecha. **Nunca** fuentes, notas, autores,
  `valor_verificado` ni evidencias. Es una **proyección cerrada** (sin passthrough de columnas).
- Se mantiene con la **misma función de trigger** (security definer, lado servidor) que escribe las
  verificaciones e implementa la matriz M20: al confirmar/invalidar un grupo, hace `upsert`/`delete`
  aquí. El camino de **lectura anónima nunca usa definer**.
- **RLS de lectura anónima** — solo si la entidad padre está publicada (patrón hijo-público, B5):

```sql
alter table verificacion_publica enable row level security;
create policy verif_publica_lectura on verificacion_publica for select to anon
using (
  (entidad_tipo = 'tramite'     and exists (select 1 from tramites     t where t.id = entidad_id and t.estado='publicado')) or
  (entidad_tipo = 'dependencia' and exists (select 1 from dependencias d where d.id = entidad_id and d.estado='publicado')) or
  (entidad_tipo = 'directorio'  and exists (select 1 from directorio   x where x.id = entidad_id and x.estado='publicado'))
);
```

- La ficha calcula la antigüedad (M24) leyendo esta tabla: rango "verificada entre {min} y {max}" +
  fecha por sección. Regla M13 para la fecha por dato (el grupo más restrictivo) se aplica en la capa
  de presentación con estos datos.

### Políticas RLS del resto (B5, congeladas)

- **Publicables** (`tramites`, `dependencias`, `directorio`, `guias`): `select` anon solo
  `estado='publicado'`.
- **Hijas públicas** (`*_telefonos`, `costos_tramite`, `tramite_horarios`, `dependencia_horarios(+excep.)`,
  `guias_tramites`): `select` anon con `EXISTS (padre publicado)`.
- **Privadas** (todas las de §1): sin política anon. Escritura solo por service role tras `requireAdmin`.

### Pruebas RLS (salida de Fase 1A/1B)

- **RLS-1 (acceso directo denegado):** como `anon`, `select` directo sobre `tramite_verificaciones`,
  `*_evidencias`, `fuentes`, `*_historial`, `*_reportes` y sobre una entidad en `borrador` y sus hijas
  → **0 filas / denegado**.
- **RLS-2 (vía proyección):** como `anon`, `select` sobre `verificacion_publica`:
  - entidad **publicada** → devuelve `(entidad, grupo, fecha)`, **sin** columnas privadas. ✅ permitido
  - entidad en **borrador** → **0 filas**. ✅ denegado
  - no acepta filtros que revelen tablas privadas (la tabla no las referencia).

Ambas se automatizan con un cliente `anon` (mismo patrón que las pruebas M17) y son criterio de
publicación (PLAN.md §9).

---

## 8. Pendiente para Fase 1B (tras este diseño)

1. ✅ Escribir la migración `0002_modelo_contenido.sql` derivada de este documento (con RLS y enums)
   — hecha y probada en PGlite (`pnpm probar-migracion`: 32 tablas, B7, RLS-1/RLS-2 en verde).
   **Aún no aplicada a Supabase** (crear tablas en producción es decisión aparte).
2. Escribir los **triggers de la matriz M20** (`matriz-invalidacion.md` §7) y la función que mantiene
   `verificacion_publica` → migración `0003`.
3. Automatizar las pruebas **RLS-1** y **RLS-2** contra Supabase real (además del test PGlite) y la
   suite de triggers **TI-1..TI-6**.
4. Importar la investigación editorial desde la plantilla de proveniencia (TRI-219).
5. CRUD en el admin sobre el modelo, con `requireAdmin({escritura:true})` en cada action.
