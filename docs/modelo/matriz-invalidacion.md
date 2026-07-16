# Grupos críticos y matriz de invalidación (M20)

> **Versión 1 — 2026-07-16.** Documento versionado (PLAN.md §2.2, requisito B4/M20).
> Fuente de verdad de qué edición invalida qué verificación. Los **triggers** de las
> migraciones (Fase 1B) se derivan directamente de este documento y se prueban con la
> suite del §5. Cualquier cambio de reglas se hace **aquí primero** y luego en los triggers.

Cierra una de las 6 condiciones del NO GO a migraciones (PLAN.md §9). No implica escribir
migraciones todavía: es diseño.

---

## 1. Principio

La frescura se registra **por grupo crítico, no por ficha** (B4). Una edición editorial de
un dato **invalida la verificación vigente del grupo al que pertenece** (trigger) y el grupo
vuelve a la cola de verificación del admin (PLAN.md §3.4). La fecha que ve el ciudadano deriva
de estas verificaciones — **nunca se edita a mano** (M24).

Separación editorial / comercial (B8):
- **Grupos editoriales** publican la ficha informativa.
- **Grupos comerciales** activan el CTA de gestoría. Invalidar uno comercial **no** despublica
  la ficha; invalidar uno editorial **no** toca el CTA.

---

## 2. Grupos críticos por entidad

| Entidad | Grupo | Clasificación | Fuente del dato | Notas |
|---|---|---|---|---|
| **Trámite** | `requisitos` | editorial | `tramites.requisitos` | checklist |
| | `costos` | editorial | `costos_tramite` (todas las filas) | derechos + gastos; honorarios ver §4 |
| | `contacto` | editorial | consumido de la dependencia vinculada | teléfono/extensión/ventanilla del trámite |
| | `ubicacion` | editorial | consumido de la dependencia vinculada | dónde se hace |
| | `horarios_propios` | editorial | `tramite_horarios` | **solo si el trámite tiene horarios propios**; si no, consume los de la dependencia (M21) |
| | `representacion` | **comercial** | `representacion_tramite` | activa/desactiva el CTA |
| **Dependencia** | `contacto` | editorial | `dependencia_telefonos`, `dependencias.email`, `sitio_oficial_url` | |
| | `ubicacion` | editorial | `dependencias.direccion/lat/lng` | |
| | `horarios` | editorial | `dependencia_horarios` (+ excepciones) | los trámites lo consumen (M21) |
| **Ficha de directorio** | `contacto` | editorial | `directorio_telefonos` | |
| | `ubicacion` | editorial | `directorio.direccion` | |

> El enum de `*_verificaciones.grupo` se congela con estos valores. El trámite **no** tiene un
> grupo `horarios` propio genérico: o consume el `horarios` de su dependencia (M21) o tiene
> `horarios_propios`. Nunca ambos a la vez.

Campos **narrativos** que NO pertenecen a ningún grupo crítico y por tanto **no invalidan**
verificaciones (solo se registran en `*_historial`): `tramites.nombre/resumen/descripcion_md/
faqs/tiempo_estimado/documentos`, `dependencias.nombre/descripcion`, `directorio.nombre/
categoria`. *(Revisar en Fase 1B si `documentos` = documentos requeridos; entonces pasaría a
`requisitos`.)*

---

## 3. Matriz de invalidación

Leyenda — **D** = efecto directo sobre la entidad editada · **I** = efecto **indirecto**
(cascada a otra entidad; se prueba explícitamente, §5).

| # | Origen del cambio (tabla · operación/columna) | Grupo(s) invalidado(s) | Entidad(es) afectada(s) | D/I | Clasif. |
|---|---|---|---|---|---|
| 1 | `tramites.requisitos` (UPDATE) | `requisitos` | el trámite | D | editorial |
| 2 | `costos_tramite` (INSERT/UPDATE/DELETE, cualquier fila) | `costos` | el trámite | D | editorial |
| 3 | `costos_tramite` con `categoria='honorario'` (INSERT/UPDATE/DELETE) | `costos` **+** preparación comercial (revisar precio del CTA) | el trámite | D | editorial **y** comercial |
| 4 | `tramite_horarios` (INSERT/UPDATE/DELETE) | `horarios_propios` | el trámite | D | editorial |
| 5 | `representacion_tramite` (cualquier cambio de estado/campos) | `representacion` → **desactiva el CTA** | el trámite | D | comercial |
| 6 | `tramites.dependencia_id` (UPDATE — re-vinculación) | `contacto`, `ubicacion`, y el vínculo de `horarios` | el trámite | **I** | editorial |
| 7 | `dependencia_telefonos` (INSERT/UPDATE/DELETE) | `contacto` | la dependencia **D** + cada trámite que la consume **I** | D+I | editorial |
| 8 | `dependencias.email` / `sitio_oficial_url` (UPDATE) | `contacto` | la dependencia **D** + trámites que la consumen **I** | D+I | editorial |
| 9 | `dependencias.direccion/lat/lng` (UPDATE) | `ubicacion` | la dependencia **D** + trámites que la consumen **I** | D+I | editorial |
| 10 | `dependencia_horarios` (INSERT/UPDATE/DELETE) | `horarios` | la dependencia **D** + trámites **sin** `horarios_propios` que la consumen **I** | D+I | editorial |
| 11 | `dependencia_horarios_excepciones` (INSERT/UPDATE/DELETE) | `horarios` | igual que #10 | D+I | editorial |
| 12 | `directorio_telefonos` (INSERT/UPDATE/DELETE) | `contacto` | la ficha de directorio | D | editorial |
| 13 | `directorio.direccion` (UPDATE) | `ubicacion` | la ficha de directorio | D | editorial |

**Reglas de cascada (filas 6–11):**
- El trámite consume los datos de contacto/ubicación/horarios de **su** dependencia (M21). Editar
  la dependencia invalida el grupo correspondiente **de la dependencia** y, por cascada, marca
  el mismo grupo **en los trámites que la referencian**. Los trámites con `horarios_propios`
  quedan **exentos** de la cascada de horarios (fila 10/11).
- Re-vincular un trámite a otra dependencia (fila 6) es la cascada más peligrosa: el trámite
  pasa a mostrar contacto, ubicación y horarios de una dependencia distinta, así que **los tres
  grupos** vuelven a la cola aunque la nueva dependencia esté verificada (la verificación es
  "este dato es correcto **para este trámite**").

---

## 4. Casos especiales

- **Honorarios → CTA (M19, fila 3):** el precio del CTA se deriva de la fila `costos_tramite`
  vigente con `categoria='honorario'`. Cualquier cambio en esa fila invalida `costos` (editorial)
  **y** manda la preparación comercial a revisión. No hay `precio_honorarios` duplicado.
- **Representación (fila 5, B8):** invalidar `representacion` **solo** desactiva el CTA; la ficha
  informativa sigue publicada. Es la separación editorial/comercial en acción.
- **Horarios consumidos (M21):** no se copian snapshots de horarios al trámite. Si el trámite no
  tiene `horarios_propios`, su frescura de horarios **es** la del grupo `horarios` de la
  dependencia (no hay fila de verificación de horarios en el trámite que invalidar; se refleja).

---

## 5. Regla M13 — un dato en dos grupos

Si un dato queda cubierto por **más de un grupo**:
1. **Invalidación:** una edición invalida **todos** los grupos a los que pertenece el dato (no
   se elige uno).
2. **Presentación de frescura (M24):** la fecha mostrada para ese dato es la del grupo **más
   restrictivo** = la verificación **más antigua** de entre sus grupos. "Gana el más restrictivo"
   = se muestra la fecha más vieja, nunca la más reciente.
3. La fecha global de la ficha sigue siendo la del **grupo editorial más antiguo** de toda la
   ficha (PLAN.md §2.2).

En el modelo actual la mayoría de los datos pertenecen a un solo grupo; la regla existe para no
"redondear hacia lo optimista" cuando un campo se reclasifique o se comparta a futuro.

---

## 6. Suite de pruebas obligatoria de los triggers (Fase 1B)

Las ediciones **indirectas** se prueban explícitamente (PLAN.md §2.2). Cada caso debe
demostrarse con datos reales antes de publicar:

| Caso | Acción | Resultado esperado |
|---|---|---|
| TI-1 | Editar `dependencia_telefonos` de una dependencia con 2 trámites | `contacto` invalidado en la dependencia **y en los 2 trámites** |
| TI-2 | Editar `dependencia_horarios`; un trámite con `horarios_propios` y otro sin él | `horarios` invalidado en la dependencia y en el trámite **sin** propios; el que tiene `horarios_propios` **no** cambia |
| TI-3 | Editar `dependencias.direccion` | `ubicacion` invalidado en la dependencia y en sus trámites |
| TI-4 | Cambiar `tramites.dependencia_id` | `contacto`, `ubicacion` y horarios del trámite invalidados |
| TI-5 | Insertar/editar/borrar `costos_tramite` con `categoria='honorario'` | `costos` invalidado **y** CTA a revisión comercial |
| TI-6 | Cambiar `representacion_tramite` | CTA desactivado; **ningún** grupo editorial tocado (verifica B8) |
| TD-1..n | Editar cada origen directo (filas 1,2,4,12,13) | solo su grupo, solo su entidad |

Una edición editorial deja el grupo en la cola del admin (PLAN.md §3.4); la despublicación solo
ocurre por la regla de conflicto M13 cuando el dato es indispensable (`estado='vencido'`).

---

## 7. Pendiente al migrar (Fase 1B)

- Traducir cada fila del §3 a un trigger `AFTER INSERT/UPDATE/DELETE` que escriba la invalidación
  en la tabla `*_verificaciones` correspondiente.
- Implementar la cascada (filas 6–11) resolviendo los trámites afectados por FK real (sin
  polimorfismo — B5/B7).
- Congelar el enum `grupo` con los valores del §2.
- Automatizar la suite del §6 como pruebas de regresión de los triggers.
