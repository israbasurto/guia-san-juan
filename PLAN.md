# Plan de desarrollo — Guía San Juan

> Documento de trabajo para la evolución de guiasanjuan.mx: de landing (Feria 2026) a portal ciudadano de trámites, dependencias y directorio, con servicio de gestoría como modelo de negocio y embudo de leads para Trinium.
>
> **Nota sobre "agentes"**: en este documento, agente = **persona** (gestor humano) que renta su tiempo para hacer trámites disponibles como servicio en nombre del ciudadano. No se refiere a agentes de IA. Modelo operativo: se arranca con equipo propio/de confianza; la red abierta de agentes externos (marketplace) queda como evolución futura (ver §7, Fase 4+).
>
> La única IA contemplada en el proyecto es un **bot automatizado de WhatsApp** (futuro, Fase 3) que responde dudas e información desde la base de datos — no sustituye ni se confunde con los agentes humanos del servicio de gestoría.
>
> **v2 — incorpora la auditoría del 2026-07-12** (dictamen NO GO al plan v1): el camino crítico ahora es confianza → seguridad → operación, y después automatización y adquisición. Los cambios clave: mínimo transaccional adelantado a Fase 2 (B1), modelo de proveniencia/verificación desde la primera ficha (B2), endurecimiento del admin como precondición del CRUD (B3), Fase 1 dividida en 1A/1B/1C (M1), criterios de salida controlables (M2), expectativas SEO corregidas (M3), CTA comercial desactivado hasta que el servicio sea operable (M5).
>
> **v4 — incorpora la tercera auditoría**: `evidencias` sin polimorfismo — tablas específicas por entidad (B7); **preparación editorial separada de preparación comercial** — la representación NO es grupo obligatorio para publicar una ficha informativa, solo para activar el CTA (B8); `admin_usuarios.id` ligado a `auth.users.id` con gobierno de roles (B9); proyección pública diseñada para no eludir RLS, con pruebas anónimas (M18); honorarios con **una sola fuente de verdad** en `costos_tramite` (M19); **matriz de invalidación** tabla/columna → grupo → entidades (M20); horarios viven en la dependencia, el trámite los consume (M21); ruta `/carga/[token]` desde Fase 2 (M22); criterios concretos anti-archivos-maliciosos (M23); presentación honesta de antigüedad por sección (M24); salida de Fase 2 con controles verificables, no "sin incidentes" (M25). **Puertas: GO continuar 1A · NO GO migraciones hasta B7-B9 · NO GO publicar hasta pruebas RLS y separación editorial/comercial.**
>
> **v3 — incorpora la segunda auditoría (GO CONDICIONADO a Fase 1A)**: frescura calculada **por campo crítico**, no por ficha (B4); relaciones polimórficas sustituidas por **tablas de relación específicas** con FK reales y RLS por tabla hija (B5); diseño del acceso de un solo uso y snapshot de la solicitud entre proyectos (B6, para Fase 2); representación con dos controles separados —operativo y jurídico— (M11); tabla de costos con moneda/rango/vigencia (M12); regla de conflicto entre fuentes sin "dato conservador" (M13); evidencias clasificadas y privadas por defecto (M14); seguridad perimetral asignada a Fase 1A (M15); auditoría de la captura existente `propuestas` (M16); "admin auditado" convertido en pruebas de aceptación (M17). **Puertas vigentes: GO iniciar 1A · NO GO ejecutar migraciones hasta congelar §2.2 · NO GO publicar fichas hasta cerrar B4-B5 · NO GO Fase 2 hasta cerrar B6 y precondiciones.**
>
> Última actualización: 2026-07-12

---

## 0. Estado actual del proyecto (punto de partida)

| Área | Estado |
|---|---|
| Framework | Next.js 15 (App Router, JSX), React 19, pnpm, Vercel + Analytics |
| Páginas | Home única (teaser Feria 2026; la feria vive en `feria.guiasanjuan.mx`) |
| Datos | Supabase ya integrado (tabla `propuestas`, cliente anon + service role) |
| Admin | Panel `/admin` con **Supabase Auth** (email+contraseña, sesión firmada, `requireAdmin` por action — B3 resuelto en código, acreditación M17 pendiente, ver §5.1) |
| SEO | Metadata completa, JSON-LD, `sitemap.js`, `robots.js`, Open Graph |
| Legal | Disclaimer "iniciativa independiente / no oficial" en home y footer (**redacción ambigua — M4, ver §1.1**) |
| Estilos | CSS propio (`globals.css`), temas claro/oscuro (`data-mood`), fuentes Google |

**Decisiones de adaptación respecto a las sugerencias originales:**

- **CMS**: no se agrega Strapi/Payload/Directus. Supabase cumple ese rol: tablas de contenido + panel `/admin` ampliado (después de endurecerlo, §5.1). Actualizar un teléfono = editar fila, sin deploy (ISR/revalidación).
- **Backend transaccional**: no se levanta servidor aparte. La separación se logra con un **proyecto Supabase independiente** para datos personales. **Corrección B1**: este mínimo transaccional NO se condiciona al volumen — debe existir **antes del primer piloto que reciba datos o documentos** (inicio de Fase 2), aunque su interfaz sea manual.
- **SSG/ISR**: contenido de trámites/dependencias servido estático + `revalidate`.
- **Cloudflare**: ya NO es requisito de Fase 1. Vercel ya da CDN/TLS; agregar Cloudflare implica cambio operativo y riesgo de doble caché. Se justifica solo si aparece necesidad concreta (WAF, mitigación de bots) — decisión diferida.

---

## 1. Posicionamiento y marco legal (transversal)

### 1.1 Diferenciación del sitio oficial

- [x] Disclaimer en home y footer (existe, pero ver siguiente punto).
- [ ] **Corregir redacción ambigua (M4)**: "proyecto independiente de Trinium" puede leerse como "independiente DE Trinium". Redacción inequívoca en todo el sitio:
  > "Guía San Juan es un proyecto de Trinium, **independiente del Gobierno Municipal y de las dependencias públicas mencionadas**. No es un sitio oficial."
  La redacción final se revisa jurídicamente, en especial donde se ofrezca gestoría.
- [ ] Componente reutilizable `<DisclaimerOficial />` en cada página de trámite y dependencia.
- [ ] Página `/acerca-de/` explicando qué es el proyecto, quién lo hace y qué NO es.
- [ ] Evitar en diseño/copy cualquier imitación de identidad gráfica municipal.

### 1.2 Marco legal del servicio de agentes — **bloqueante para lanzar Fase 2 comercial**

Referencia vigente: **LFPDPPP 2025** (la ley de 2010 quedó abrogada; texto vigente con reforma al 14-nov-2025: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf). Toda mención a "LFPDPPP" en este documento refiere a la ley nueva.

- [ ] **Matriz trámite → representación (M6)**: NO asumir tipo de poder por dependencia ("Catastro es notarial") — la representación cambia según trámite, acto, oficina, tipo de solicitante y documentación. La matriz vive en BD con: fuente normativa u oficio de confirmación, jurisdicción y oficina, fecha de vigencia, tipo de solicitante, restricciones/excepciones y estado `pendiente_de_confirmar`. Un trámite solo se ofrece como servicio con su fila **confirmada y con revisión jurídica**. (Sustituye al enum simple `tipo_poder` del plan v1.)
- [ ] **Aviso de privacidad** (LFPDPPP 2025): versión integral en `/privacidad/` + simplificada en cada punto de captura. Debe incluir **encargados y transferencias**: Supabase, Vercel, Meta/WhatsApp, proveedor de pagos y cualquier servicio de IA.
- [ ] **Términos de servicio** en `/terminos/`: alcance, política de reembolso ante rechazo por causas del ciudadano vs. de la autoridad, tiempos no garantizados.
- [ ] **Política de retención por categoría (M7)** — tabla de conservación explícita; "al concluir + N días" no basta:

  | Categoría | Conservación | Nota |
  |---|---|---|
  | Solicitud (metadatos) | Definir (p. ej. 12 meses) | sin documentos |
  | Identificación (INE/CURP) | Mínima: borrar al concluir el trámite | nunca en respaldos de largo plazo |
  | Carta poder / poder | Definir con jurídico | puede requerir conservación probatoria |
  | Comprobantes de domicilio | Mínima: borrar al concluir | |
  | Conversaciones (WhatsApp) | Definir; depurar del teléfono del operador | ver §5.3 canal |
  | Evidencia de consentimiento | Conservar mientras exista relación + plazo legal | |
  | Facturación y pagos | Plazo fiscal (5 años) | sin documentos de identidad adjuntos |
  | Bitácoras de acceso | Definir (p. ej. 12 meses) | |

  Definir además qué significa "eliminar" frente a: respaldos automáticos, logs, dispositivos personales de operadores y copias en WhatsApp.
- [ ] **Procedimientos**: respuesta a incidentes de seguridad, atención de derechos ARCO, y evidencia verificable de eliminación.
- [ ] **Revisión jurídica mexicana** de todo lo anterior **antes del piloto comercial** — no es opcional.
- [ ] Machotes de carta poder simple descargables por trámite (solo los confirmados en la matriz).

---

## 2. Arquitectura de información

```
guiasanjuan.mx/
├── /                            → home (evoluciona: buscador prominente "¿Qué trámite necesitas?")
├── /dependencias/               → índice de dependencias
│   └── /dependencias/[slug]/    → ficha: qué hace, teléfonos, horarios, ubicación (mapa), trámites que gestiona
├── /tramites/                   → índice con buscador y filtros por categoría
│   └── /tramites/[slug]/        → ⭐ LA página clave (ver §2.1)
├── /directorio/                 → directorio telefónico completo, buscable
├── /agentes/                    → landing del servicio de gestoría (Fase 2, tras cierre legal)
│   └── /agentes/solicitar/      → flujo de contratación (Fase 3)
├── /guias/                      → contenido long-tail ("cómo sacar tu acta de nacimiento en SJR")
│   └── /guias/[slug]/
├── /acerca-de/                  → qué es el proyecto (independencia)
├── /privacidad/  /terminos/     → legal
└── /desarrollado-por-trinium/   → puente de leads + caso de estudio
```

Convenciones de URL: español, minúsculas, sin acentos, guiones. Slugs inmutables una vez publicados (cambios → redirect 301).

### 2.1 Anatomía de la página de trámite (activo SEO principal)

1. **H1** = intención de búsqueda literal.
2. Resumen de 2-3 líneas.
3. `<DisclaimerOficial />` (redacción inequívoca de §1.1).
4. Qué es / para qué sirve.
5. **Requisitos** como checklist visual.
6. **Costos desglosados**: honorarios del servicio (si aplica), derechos gubernamentales, gastos y total estimado — cada uno con fecha de vigencia. No un solo "costo".
7. **Dónde se hace**: dependencia vinculada (botón `tel:`, "Cómo llegar" → Google Maps), horarios.
8. Documentos descargables si existen.
9. **CTA del servicio de agentes — regla M5**: NO visible mientras el servicio no sea operable. Estados: `oculto` (default en Fase 1) → `proximamente` (sin invitar a enviar datos ni documentos) → `activo` (solo por trámite, cuando estén aprobados: viabilidad de representación, precio, proceso operativo, términos y reembolsos, aviso de privacidad y canal seguro).
10. **Preguntas frecuentes** (acordeón accesible).
11. **"Última verificación: {fecha}"** — respaldada por el modelo de proveniencia (§3.4), no una fecha suelta.
12. Trámites relacionados (interlinking).

### 2.2 Modelo de datos (Supabase — proyecto de contenido)

Cambios v3 (B4/B5): la frescura se registra **por campo crítico, no por ficha**; se eliminan las relaciones polimórficas (`entidad_tipo + entidad_id`) a favor de **tablas de relación específicas con FK reales** — más repetitivas pero auditables (estrategia recomendada por el dictamen B5). Timestamps de verificación/auditoría con zona (`timestamptz`); `date` solo para vigencias editoriales. Moneda explícita aunque hoy todo sea MXN.

> ⛔ **Puerta (v4)**: las migraciones NO se escriben hasta cerrar B7-B9: (1) `evidencias` con FK real sin polimorfismo, (2) `admin_usuarios` ligado a la identidad autenticada, (3) preparación editorial separada de la comercial, (4) honorarios sin duplicidad, (5) proyección pública definida con sus pruebas RLS, (6) matriz de invalidación documentada.
>
> Mientras tanto, la investigación editorial NO se detiene: se registra en una **plantilla de proveniencia controlada** (mismo esquema: entidad, grupo, valor, fuente, fecha, responsable) que se importa al ejecutar las migraciones sin perder trazabilidad.

```
-- Estado editorial en toda entidad publicable (B2):
-- estado enum('borrador','en_revision','publicado','vencido','retirado')

admin_usuarios                     -- B9: identidad ligada a la autenticación, no paralela
  id → auth.users.id,              -- FK real al proveedor de identidad (o id inmutable equivalente)
  nombre, email, rol, activo bool
  -- Gobierno (B9): el rol solo lo cambia un rol superior o proceso controlado;
  -- el rol NUNCA se confía del cliente (se lee en servidor por sesión);
  -- activo=false o cambio de rol ⇒ revocación de sesiones;
  -- protegido contra eliminar/degradar al ÚLTIMO administrador.
  -- TODO campo de actor en el modelo (verificado_por, confirmado_por,
  -- revisado_por, autor) es FK real a esta tabla — nunca texto libre.

dependencias
  id, slug, nombre, descripcion, direccion, lat, lng,
  email, sitio_oficial_url, estado, creado_en, actualizado_en
  -- Retiro con trámites publicados: bloqueado hasta reasignar o retirar sus trámites

dependencia_horarios               -- estructurado, TZ America/Mexico_City (no jsonb libre)
  id, dependencia_id → dependencias, dia_semana, abre, cierra

dependencia_horarios_excepciones   -- festivos, cierres temporales
  id, dependencia_id → dependencias, fecha, motivo, cerrado bool, abre, cierra

dependencia_telefonos              -- FK real (B5); repetir patrón: directorio_telefonos
  id, dependencia_id → dependencias, etiqueta, numero, extension, confirmado bool

categorias_tramite
  id, slug, nombre, orden

tramites
  id, slug, nombre, resumen, descripcion_md,
  categoria_id → categorias_tramite, dependencia_id → dependencias,
  requisitos jsonb, tiempo_estimado,
  documentos jsonb, faqs jsonb,
  cta_estado enum('oculto','proximamente','activo') default 'oculto',   -- M5
  grupos_obligatorios text[],      -- B8: configurables por trámite; sin verificaciones
                                   -- vacías para satisfacer un enum rígido (hay trámites
                                   -- sin costo, 100% en línea, sin horario físico,
                                   -- sin representación o sin dependencia única)
  estado, creado_en, actualizado_en
  -- M19: SIN precio_honorarios — el precio del CTA se deriva del costo
  -- vigente aprobado en costos_tramite (una sola fuente de verdad)

tramite_horarios                   -- M21: SOLO si el trámite tiene horarios propios;
  id, tramite_id → tramites,       -- por defecto la ficha consume la verificación
  dia_semana, abre, cierra         -- vigente de dependencia_horarios (sin copiar snapshots)

costos_tramite                     -- M12+M19: única fuente de verdad de TODO costo
  id, tramite_id → tramites, concepto,
  categoria enum('derecho','honorario','gasto','otro'),   -- M19
  tipo enum('fijo','rango','desde','desconocido'),
  importe_min numeric null, importe_max numeric null, moneda char(3) default 'MXN',
  condiciones,                     -- variantes por solicitante/modalidad, descuentos, exenciones
  vigencia_inicio date, vigencia_fin date null,
  fuente_id → fuentes
  -- El total en la ficha se muestra como ESTIMACIÓN cuando hay rangos o variables
  -- La presencia y precio del CTA se derivan de la fila categoria='honorario' vigente

representacion_tramite             -- M11: dos controles SEPARADOS, no un enum único
  id, tramite_id → tramites, jurisdiccion, oficina,
  tipo_solicitante, tipo_representacion enum('no_aplica','carta_simple','notarial'),
  fuente_normativa, fecha_vigencia, restricciones, version,
  confirmacion_operativa_estado enum('pendiente_de_confirmar','confirmado',
                                     'rechazado','vencido','requiere_revalidacion','no_ofrecido'),
  confirmado_por → admin_usuarios, confirmado_en timestamptz,
  revision_juridica_estado enum('pendiente','aprobada','rechazada','vencida'),
  revisado_por → admin_usuarios, revisado_en timestamptz   -- FK real, no texto libre
  -- CTA 'activo' SOLO con ambas aprobaciones vigentes.
  -- B8: esta tabla es PREPARACIÓN COMERCIAL — no bloquea publicar la ficha informativa

-- Proveniencia y verificación (B2 + B4) — DESDE FASE 1, POR CAMPO CRÍTICO:
fuentes                            -- catálogo de fuentes; PRIVADA por defecto
  id, url, tipo enum('web','telefono','presencial','documento_oficial'), descripcion,
  hash_contenido null              -- se llena al automatizar el monitoreo (Fase 3)

-- Relación fuente↔entidad con FK real (B5): tramite_fuentes, dependencia_fuentes, directorio_fuentes
tramite_fuentes
  tramite_id → tramites, fuente_id → fuentes

-- Verificación POR CAMPO/GRUPO CRÍTICO (B4). Patrón repetido con FK real:
-- tramite_verificaciones, dependencia_verificaciones, directorio_verificaciones
tramite_verificaciones             -- PRIVADA por defecto
  id, tramite_id → tramites,
  grupo enum('requisitos','costos','horarios_propios','representacion','contacto','ubicacion'),
  valor_verificado jsonb,          -- snapshot/hash del valor confirmado
  fuente_id → fuentes,
  resultado enum('confirmado','cambio_detectado','conflicto_entre_fuentes','no_localizable'),
  notas, verificado_por → admin_usuarios, verificado_en timestamptz
  -- Reglas B4 + B8 + M20 + M21:
  --  · vigencia por grupo; la fecha de la ficha = grupo EDITORIAL más antiguo
  --  · grupos obligatorios = tramites.grupos_obligatorios (B8, configurables)
  --  · PREPARACIÓN EDITORIAL (publica la ficha): requisitos, costos,
  --    contacto/ubicación, horarios cuando apliquen
  --  · PREPARACIÓN COMERCIAL (activa el CTA): representación con ambos
  --    controles vigentes + honorarios + términos + canal seguro
  --  · horarios: se consume la verificación vigente de la DEPENDENCIA (M21);
  --    'horarios_propios' solo si existe tramite_horarios
  --  · una edición INVALIDA la verificación del grupo afectado según la
  --    MATRIZ DE INVALIDACIÓN (M20) — ver abajo
  --  · el cron vence GRUPOS, no fichas

-- Matriz de invalidación (M20) — DOCUMENTADA v1 (2026-07-16): ver
-- docs/modelo/matriz-invalidacion.md (13 reglas, cascadas indirectas, regla M13,
-- suite de pruebas de triggers). Resumen — las ediciones INDIRECTAS se prueban explícitamente:
--   tramites.requisitos            → grupo 'requisitos' del trámite
--   costos_tramite (cualquier op)  → grupo 'costos' del trámite (honorario → además CTA)
--   dependencia_telefonos          → grupo 'contacto' de la dependencia
--                                    y de sus trámites que lo consumen
--   dependencia_horarios(+excep.)  → grupo 'horarios' de la dependencia
--                                    y de trámites SIN horarios_propios que la consumen
--   tramites.dependencia_id cambia → grupos 'ubicacion','contacto','horarios' del trámite
--   representacion_tramite         → preparación comercial del trámite (desactiva CTA)

-- Evidencias SIN polimorfismo (B7): tabla específica por entidad, FK real:
tramite_evidencias                 -- → tramite_verificaciones; patrón repetido:
  id, verificacion_id → tramite_verificaciones,   -- dependencia_evidencias, directorio_evidencias
  tipo enum('captura','archivo_oficial','correo','nota_telefonica'),
  clasificacion enum('interna','publicable'),
  contiene_datos_personales bool,  -- NO es etiqueta informativa: activa automáticamente
                                   -- política de retención y acceso restringido (trigger)
  retener_hasta date, ruta_privada
  -- Llamadas: registrar fecha, dependencia, extensión y resultado. Sin grabaciones
  -- salvo fundamento y política específica.

-- Historial por entidad con FK real (B5): tramite_historial, dependencia_historial, ...
tramite_historial                  -- PRIVADA
  id, tramite_id → tramites, diff jsonb, autor → admin_usuarios, creado_en timestamptz

guias
  id, slug, titulo, resumen, contenido_md, publicado_en, actualizado_en, estado

guias_tramites                     -- tabla puente: integridad + interlinking
  guia_id → guias, tramite_id → tramites

directorio
  id, nombre, categoria, direccion, estado
  (+ directorio_telefonos, directorio_fuentes, directorio_verificaciones)

-- Reportes ciudadanos por entidad (B5): tramite_reportes, dependencia_reportes, ...
tramite_reportes                   -- PRIVADA
  id, tramite_id → tramites, mensaje, creado_en timestamptz, atendido bool

legal_versiones                    -- versionado de disclaimer, aviso de privacidad y términos
  id, documento enum('disclaimer','aviso_privacidad','terminos'), version, texto, vigente_desde

busquedas_sin_resultado            -- filtrar ANTES de persistir (nunca datos personales);
  id, consulta_normalizada, veces, ultima_vez   -- retención corta (p. ej. 90 días, job de purga)
```

**Frescura por campo (B4) y su presentación (M24)** — sin comunicar precisión engañosa:
- Presentación recomendada en la ficha: "**Información crítica verificada entre el {fecha más antigua} y el {más reciente}**", con la fecha por sección cerca de cada bloque (Requisitos: 3 abr · Costos: 8 jul · Horarios: 10 jul).
- Si se usa una sola fecha, se etiqueta "**Verificación crítica más antigua**" — nunca "última verificación", que sugiere que toda la ficha se revisó ese día.
- Nada de esto es editable a mano: todo deriva de las tablas de verificación (privadas).

**Política RLS (B5)**:
- Entidades publicables: lectura pública solo `estado = 'publicado'`.
- **Tablas hijas públicas** (`*_telefonos`, `costos_tramite`, `guias_tramites`, horarios): su política **demuestra que el padre está publicado** (`EXISTS (... estado='publicado')`) — un teléfono de una dependencia en borrador no se expone.
- **Privadas por defecto, sin política de lectura anónima**: `fuentes`, `*_fuentes`, `*_verificaciones`, `*_evidencias`, `*_historial`, `*_reportes`, `admin_usuarios`, notas y autores.
- **Nota B3**: el service role omite RLS — la barrera real de escritura es la autorización en cada server action (§5.1).

**Proyección pública de verificación (M18)** — la vista que expone la fecha no puede ser una puerta trasera:
- Expone **únicamente**: id público de la entidad, grupo, fecha y el estado público necesario. **Nunca** fuentes, notas, autores, `valor_verificado` ni evidencias.
- Filtra por padre `publicado` en su propia definición.
- Definida con `security_invoker` (o equivalente): no debe ejecutar con privilegios que omitan las políticas RLS subyacentes.
- No acepta filtros arbitrarios sobre tablas privadas (proyección cerrada, sin passthrough de columnas).
- **Pruebas con usuario anónimo**: acceso directo a tablas privadas → denegado; acceso a un borrador y a sus hijos privados, directo Y a través de la vista/API → denegado. (Identificadas como pruebas **RLS-1** directa y **RLS-2** vía proyección — referenciadas en la salida de Fase 1A.)

Tablas del proyecto transaccional separado: ver §5.3.

---

## 3. SEO técnico y de contenido

### 3.1 Datos estructurados — expectativas corregidas (M3)

JSON-LD se usa para **comprensión semántica**, no como promesa de rich results:

| Página | Schema | Expectativa realista |
|---|---|---|
| `/tramites/[slug]/` | `GovernmentService` + `BreadcrumbList` | Comprensión semántica; breadcrumbs sí pueden mostrarse |
| `/dependencias/[slug]/` | `GovernmentOffice` (horarios, teléfono, geo) + `BreadcrumbList` | Ídem; datos ricos en resultados locales posibles |
| `/guias/[slug]/` | `Article` (HowTo solo semántico) | **Rich results de HowTo: deprecados** — no venderlos como activo |
| FAQs | `FAQPage` solo semántico | **Rich results de FAQ: reservados a sitios gubernamentales/salud reconocidos** — este portal declara no ser oficial; no presupuestar impacto visual |
| Home | `WebSite` + `Organization` | **Sin `SearchAction`**: Google eliminó el sitelinks search box (nov 2024) |

Implementación: helper `lib/schema.js` que genera el JSON-LD desde la fila de Supabase.

### 3.2 Intención de búsqueda local

- Cada trámite/dependencia apunta a UNA intención: `title` y H1 la reflejan literalmente ("requisitos licencia de conducir san juan del río", "teléfono agua potable sjr").
- Variantes "SJR" / "San Juan del Río" naturales en el cuerpo.
- `/guias/` captura long-tail que no cabe en la ficha.

### 3.3 Higiene técnica

- [ ] `sitemap.js` dinámico desde Supabase con `lastModified` real (reemplaza el actual de anclas `#`).
- [ ] ISR + `revalidatePath()` desde el admin.
- [ ] `generateMetadata()` por página; **Open Graph por ficha** (distribución vía WhatsApp) con imagen OG dinámica (`next/og`).
- [ ] Core Web Vitals con **presupuesto objetivo definido por percentil y dispositivo** (p. ej. LCP p75 móvil < 2.5s) — medible, no aspiracional.
- [ ] `next/font` (migrar del `<link>` actual), `next/image`, breadcrumbs visibles.
- [ ] **Accesibilidad verificable**: WCAG 2.2 AA con pruebas **automáticas Y manuales** (una herramienta sola no acredita AA): axe/Lighthouse + recorrido real por teclado, lector de pantalla en fichas, foco visible, acordeones accesibles (`aria-expanded`).

### 3.4 Frescura y proveniencia (B2) — desde la primera ficha

El modelo de §2.2 (fuentes, verificaciones **por grupo crítico**, historial, estados editoriales) existe **desde Fase 1A**.

**Dos preparaciones separadas (B8)** — lo comercial no bloquea la información ciudadana:

| | Grupos | Habilita |
|---|---|---|
| **Preparación editorial** | requisitos, costos, contacto/ubicación, horarios cuando apliquen (configurables por trámite) | Publicar la ficha informativa (con `cta_estado='oculto'`) |
| **Preparación comercial** | representación (ambos controles M11 vigentes), honorarios, términos, canal seguro, operación aprobada | Activar el CTA y afirmar cosas sobre la gestoría |

Ninguna ficha se publica sin sus **grupos editoriales obligatorios** verificados (fuente, fecha, responsable). La representación NO es requisito editorial.

- [ ] Ficha pública muestra la antigüedad con honestidad (M24): rango "verificada entre {fecha} y {fecha}" + fecha por sección; si es una sola, "verificación crítica más antigua". Nunca editable a mano.
- [ ] Una edición editorial de un grupo **invalida su verificación vigente** (trigger); la ficha vuelve a cola.
- [ ] Grupo con verificación > 180 días → aviso "esta información podría haber cambiado, confírmala por teléfono" + marca `dato_no_confirmado`.
- [ ] Vista en `/admin`: cola de verificación por **grupo** (lo que supera 90 días, fue invalidado por edición, o tiene reportes).

**Regla de conflicto entre fuentes (M13)** — sin "dato más conservador" (indefinible: ¿horario más corto? ¿costo más alto?):

1. No afirmar como cierto el dato en conflicto.
2. Mostrar "**dato no confirmado**" y las vías oficiales de confirmación (teléfono de la dependencia).
3. Si el dato es indispensable para la utilidad de la ficha, retirar temporalmente el campo o la ficha (`estado = 'vencido'`).
4. Registrar la resolución y qué autoridad la confirmó (fila en verificaciones con la fuente que resolvió).
5. Criterio definido de cuándo se requiere verificación presencial y cuándo basta confirmación documentada.

**Automatización del ciclo (después de que el proceso manual funcione):**

- [ ] **Cron de grupos vencidos** (Vercel Cron o `pg_cron`): vence **grupos, no fichas** (B4); arma la cola y envía resumen semanal. — *Fase 1B/2*
- [ ] **Reportes ciudadanos**: botón "¿Te sirvió? / Reportar dato incorrecto" → `*_reportes` → cola con prioridad. — *Fase 2*
- [ ] **Monitoreo de fuentes**: job que re-descarga cada `fuentes.url`, compara `hash_contenido` y alerta "la fuente cambió". — *Fase 3* (automatiza la proveniencia manual que existe desde 1A)

### 3.5 Criterios de cierre técnico (M2)

"Fichas indexadas" NO es criterio de salida (Google decide si/cuándo indexa). Criterios controlables:

- URLs publicadas, rastreables, sin `noindex`.
- Sitemap enviado y aceptado sin errores en Search Console.
- Canonical correcto en todas las fichas.
- Inspección de URL satisfactoria en una muestra.
- Datos estructurados válidos (Rich Results Test / validador schema.org).
- CWV dentro del presupuesto definido (§3.3).
- La indexación se **monitorea como métrica posterior**, no como aceptación del desarrollo.

---

## 4. Usabilidad (usuario típico: adultos mayores + gente con prisa en celular)

- **Mobile-first real**: fichas en una columna, controles táctiles ≥ 44px.
- **Buscador prominente en el home**: "¿Qué trámite necesitas?" — client-side sobre índice JSON (pocos cientos de registros) con tolerancia a acentos/errores. Evoluciona en Fase 2 a **respuestas instantáneas**:
  - **Answer box local**: "teléfono agua potable" muestra el dato con botón `tel:` sin navegar.
  - **Tolerancia a errores comunes**: "licensia", "acta de nacimineto", "sjr".
  - **Búsquedas sin resultado registradas** (sin datos personales en el log) → priorizador de qué capturar después.
- **Tipografía generosa**: cuerpo ≥ 17-18px, alto contraste en ambos temas, WCAG 2.2 AA (§3.3).
- **Acciones directas**: teléfonos `tel:` con botón grande; "Cómo llegar" → Google Maps.
- **WhatsApp para contacto y coordinación** — no como archivo documental (B1, §5.3). El flujo de contratación inicia con mensaje precargado; los documentos NUNCA viajan por WhatsApp. En fase futura este canal evoluciona a atención automatizada con el bot (§7, Fase 3).

---

## 5. Stack y seguridad

### 5.1 Endurecimiento del admin — **PRECONDICIÓN del CRUD (B3), primera tarea de Fase 1A**

Orden invertido respecto al plan v1: primero se corrige la autenticación, después se expone el CRUD. La cookie actual `gsj-admin='1'` es adivinable y el service role omite RLS: una server action mal protegida expone escritura total.

> **Estado (2026-07-13)**: implementado en código con **Supabase Auth** como proveedor de identidad (`lib/supabase-server.js`, `lib/auth.js`, `middleware.js`, `app/admin/actions.js`). Pendiente para acreditar: aplicar `supabase/migrations/0001_admin_seguridad.sql`, dar de alta al primer admin y ejecutar las 10 pruebas M17 en vivo.

- [x] Sesión firmada (HMAC/JWT) con expiración, rotación y cierre efectivo — Supabase Auth: JWT firmado + refresh token; `signOut()` revoca en el servidor.
- [x] Comparación de credenciales en tiempo constante — delegada a Supabase Auth (bcrypt en GoTrue); ya no hay comparación propia de contraseña ni `ADMIN_PASSWORD`.
- [x] Rate limiting real en login — límites integrados de GoTrue en el endpoint de autenticación (429).
- [x] **Autorización verificada en CADA server action y route handler** (no solo middleware) — `requireAdmin()` en `lib/auth.js`; el middleware solo redirige.
- [x] MFA o proveedor de identidad (p. ej. Supabase Auth) para cuentas editoriales. **B9**: `admin_usuarios.id` referencia el id inmutable del proveedor elegido (`auth.users.id`) — la identidad autenticada, el rol que autoriza, el autor en bitácora y el estado activo son **la misma cosa**, no registros paralelos. Sin esta unión, las pruebas M17-3, M17-7 y M17-8 no tienen base consistente. *(Proveedor: Supabase Auth. MFA TOTP: siguiente paso recomendado, no bloqueante.)*
- [x] Bitácora de cambios administrativos (quién publicó/verificó/editó qué y cuándo) — tabla `admin_bitacora` + `registrarBitacora()`; `updateEstado` ya registra.
- [ ] Validación estricta de entradas; **sanitización de Markdown/HTML** al renderizar (`descripcion_md`, `contenido_md`) contra XSS persistente. *(Validación agregada en las actions existentes; la sanitización de Markdown aplica cuando exista el CRUD de contenido.)*
- [ ] Gestión y rotación del service role key. *(Verificado que no llega al bundle — M17-9; falta el procedimiento de rotación documentado.)*
- [x] Protección específica de las acciones que publican, verifican o revalidan contenido — `updateEstado` exige `requireAdmin({escritura:true})`; patrón obligatorio para toda action futura.

**Pruebas de aceptación (M17)** — "admin endurecido" se acredita con estas pruebas observables, no con la frase. **Acreditación ejecutada 2026-07-16: 10/10 ✅ (TRI-215 pruebas 1-9; TRI-216 prueba 10). Queda como seguimiento operativo, no bloqueante, el simulacro de DR en un proyecto nuevo y una rotación de práctica de la llave.**

| # | Prueba | Pasa si | Estado (2026-07-16) |
|---|---|---|---|
| 1 | Cookie falsificada | Rechazada | ✅ `sb-*-auth-token` falsa → 307 a `/admin/login` (HTTP) |
| 2 | Sesión expirada | Rechazada | ✅ `getUser()` valida en servidor y rechaza token expirado/no-vivo |
| 3 | Usuario sin rol de escritura | No puede escribir | ✅ sin fila en `admin_usuarios` y `activo=false` → denegado; editor activo permitido (control +) |
| 4 | Server action llamada sin sesión | Cada una la rechaza | ✅ GET `/admin` sin sesión → 307; escritura guardada por `requireAdmin()` en cada action |
| 5 | Login tras el umbral de intentos | Limitado (rate limit efectivo) | ✅ GoTrue → 429 "Request rate limit reached" (intento 32) |
| 6 | Markdown malicioso en contenido | No ejecuta scripts al renderizar | ✅ `<script>` en propuesta → renderizado escapado (`&lt;script&gt;`) en `/admin` |
| 7 | Escritura autorizada | Queda registrada en bitácora | ✅ fila en `admin_bitacora` con `admin_id` + acción + timestamp |
| 8 | Rotación/revocación de sesión | Cierra el acceso de inmediato | ✅ `signOut` revoca el refresh token; `activo=false` corta en la siguiente petición |
| 9 | Service role key | No aparece en bundle, logs ni respuestas | ✅ ausente de `.next/static` |
| 10 | Restauración desde respaldo | Probada de verdad, no solo configurada | ✅ respaldo real + restauración verificada en Postgres aislado (7/7 tablas, 395 filas); ver `docs/operaciones/respaldo-y-restauracion.md`. Simulacro de DR en proyecto nuevo: documentado, pendiente del usuario |

### 5.2 Sitio informativo

Se mantiene: **Next.js 15 + Supabase + Vercel**, SSG/ISR. El admin (ya endurecido) se amplía a CRUD de las entidades de §2.2.

**Captura asistida por IA en el admin** — *Fase 1C, solo tras medir el cuello de botella editorial real (M1)* — con controles de procedencia (M10):

- [ ] Pegar texto de la fuente oficial → route handler (Claude API) lo convierte al formato estructurado → revisión humana. La IA nunca publica directo.
- [ ] **Cada campo extraído muestra la fuente al lado**; campos inferidos o no encontrados se marcan; el modelo tiene **prohibido completar huecos**.
- [ ] Defensa ante instrucciones maliciosas incrustadas en PDFs/páginas (prompt injection): el contenido de la fuente se trata como datos, nunca como instrucciones.
- [ ] **Nunca enviar documentos personales de ciudadanos a este flujo.**
- [ ] Registro por extracción: modelo, fecha, revisor.
- [ ] Suite de pruebas con los errores de mayor impacto: costos, fechas y negaciones ("NO se requiere X").
- [ ] Borradores de guías/FAQs desde datos ya verificados → cola editorial.

**Cabeceras y perímetro — asignado a Fase 1A, antes de publicar (M15):**

- [x] Cabeceras mínimas **enforzadas** que no dependen del CSP: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (+ `X-Frame-Options`). — implementadas en `next.config.js`
- [x] CSP en Report-Only con **periodo y criterio definidos para pasar a enforcement** (p. ej. 2 semanas sin violaciones legítimas); nonce para el script de tema. — *Report-Only desplegada en 1A; enforcement con nonce, puerta en 1B*
- [x] Rate limiting de **todas las escrituras existentes, incluida `propuestas`**. — server action + tabla `propuestas_intentos` (5 por hora por hash de IP); login limitado por GoTrue
- [x] Revisión de secretos y de exposición cliente/servidor (qué llega al bundle). — `ADMIN_PASSWORD` eliminado; service role verificada fuera de `.next/static` (M17-9). *Pendiente: quitar `ADMIN_PASSWORD` de Vercel al desplegar.*
- [x] **Backups y continuidad**: respaldo del contenido (`scripts/respaldo.mjs`), restauración probada de verdad (prueba M17-10, `scripts/probar-restauracion.mjs`), rotación de service role key y plan de continuidad editorial documentados en `docs/operaciones/respaldo-y-restauracion.md`. *(Pendiente del usuario: simulacro de DR en un proyecto nuevo y una rotación de práctica.)*
- [ ] Cloudflare: diferido (ver §0) — no es requisito de Fase 1.

**Auditoría de la captura que YA existe (M16)** — el sitio ya trata datos con la tabla `propuestas`; parte del legal mínimo de Fase 1A:

- [x] Qué campos recopila y con qué finalidad; texto de consentimiento actual; retención definida. — **Dictamen**: recopila `categoria`, `nombre`, `descripcion` (obligatorios, sobre el lugar propuesto) y `proponente`, `email`, `imagenes` (opcionales, personales). Finalidad: revisar/publicar la propuesta; el email solo para avisar el resultado. **Retención propuesta**: rechazadas se eliminan a los 6 meses; `propuestas_intentos` (hash de IP, no la IP) a los 30 días. Falta reflejarlo en el aviso de privacidad al publicarlo.
- [x] Quién tiene acceso; spam/rate limiting (hoy no tiene). — Acceso: solo admins autenticados (Supabase Auth + `requireAdmin`); se revocó el INSERT anónimo en tabla y bucket. Spam: honeypot + rate limiting por hash de IP + validación de servidor + límites de MIME/tamaño impuestos por el bucket.
- [ ] Si Vercel Analytics o el CTA de WhatsApp implican tratamientos/transferencias que el aviso de privacidad debe describir. *(Analizado: Analytics es agregado y sin cookies, pero debe mencionarse; el CTA de WhatsApp transfiere la conversación a Meta — describirlo. Se cierra al redactar el aviso.)*

### 5.3 Mínimo transaccional (B1) — **operativo ANTES del primer piloto con datos reales, inicio de Fase 2**

**Proyecto Supabase separado** exclusivo para el servicio de gestoría. Formulación correcta del aislamiento (B6): **las credenciales privilegiadas existen únicamente en servidor; el cliente recibe solo una autorización temporal, acotada a una solicitud, ruta y operación** (necesaria para subir directo al bucket).

**Reglas de canal:**
- WhatsApp = contacto y coordinación. **Prohibido** recibir por WhatsApp: INE, CURP, comprobantes, cualquier documento. El operador que reciba uno por error lo elimina y lo registra como incidente.
- **Canal privado de carga (B6)** — diseño del acceso de un solo uso, definido antes de Fase 2:
  - Token aleatorio con entropía suficiente (≥128 bits); en BD se guarda **solo su hash**.
  - Caducidad corta; un solo uso o número máximo de archivos definido.
  - Vinculado a: solicitud + tipo documental + ruta exacta de destino. Nada más.
  - Revocable; rate limiting; protección contra reutilización concurrente (marcado atómico).
  - Estado posterior a la carga registrado (subido/validado/rechazado).
  - **Sin datos personales en URL, nombre de archivo ni logs** (nombres de objeto = UUID).
  - Lista cerrada de **tipos documentales permitidos** — sin "otro" que no pase por revisión.
- **Ruta de carga (M22)**: `/carga/[token]` existe **desde Fase 2** (no esperar a `/agentes/solicitar/` de Fase 3). Alcance mínimo: valida el token, muestra aviso de privacidad simplificado, recoge consentimiento cuando corresponda, acepta solo los archivos autorizados, confirma o rechaza la carga, y **no revela si existen otros tokens o solicitudes** (respuesta idéntica para token inválido/expirado/usado).

**Archivos maliciosos — criterios de aceptación (M23), decididos antes de Fase 2:**
- [ ] Tipos realmente aceptados definidos (p. ej. JPEG/PNG/PDF, tamaño máx.).
- [ ] Todo archivo entra en **cuarentena** hasta validarse; los operadores **no pueden descargar** antes del estado `validado`.
- [ ] Escaneo con servicio seleccionado y documentado; si el escaneo no está disponible, el archivo espera (fail-closed, nunca se valida solo).
- [ ] Rechazo de archivos cifrados o imposibles de inspeccionar.
- [ ] Eliminación segura de rechazados.
- [ ] Pruebas: archivo de detección inocuo (EICAR) y archivo con MIME falsificado.

**Tablas mínimas** (interfaz puede ser manual). Sin FK entre proyectos: la solicitud guarda un **snapshot inmutable** del trámite — un cambio posterior en la ficha pública no altera el expediente histórico:
```
solicitudes         id, tramite_ref (identificador externo), tramite_snapshot jsonb
                    (nombre, versión/precio aceptado, id de la representación aprobada),
                    terminos_version, aviso_version, estado del expediente, timestamps
consentimientos     solicitud_id, aviso_version, aceptado_en
tokens_carga        solicitud_id, token_hash, tipo_documental, ruta_destino,
                    expira_en, usado_en, revocado bool
documentos          solicitud_id, tipo (de la lista cerrada), ruta_bucket (UUID),
                    subido_en, validado_en, eliminado_en
accesos             quién accedió/descargó/eliminó qué y cuándo (bitácora)
```

**Controles de almacenamiento (M8)** — bucket privado y cifrado en reposo no bastan:
- [ ] Límites de tamaño y tipos MIME permitidos; validación real del archivo (magic bytes, no solo extensión).
- [ ] Protección contra archivos maliciosos.
- [ ] Nombres de objeto no predecibles (UUID, no `ine-juan-perez.jpg`).
- [ ] URLs firmadas con duración mínima — **tratarlas como credenciales temporales** (utilizables hasta expirar).
- [ ] Restricción de descarga por expediente y rol; MFA para operadores.
- [ ] Bitácora de descarga y eliminación; prohibido compartir URLs firmadas por canales no controlados.
- [ ] Eliminación conforme a la tabla de retención (§1.2), con evidencia.

### 5.4 PWA — sin contradecir la frescura (M9)

Una ficha desactualizada servida offline es un riesgo funcional, no una comodidad:

- [ ] Estrategia de caché **por tipo de contenido**; **network-first** para todo dato sensible a vigencia (requisitos, costos, horarios).
- [ ] Toda copia cacheada muestra su fecha + aviso inequívoco cuando se consulta offline ("consultado sin conexión el {fecha} — verifica antes de acudir").
- [ ] Caducidad del caché definida; acción visible "actualizar antes de acudir".
- [ ] **Nunca cachear** datos personales ni rutas administrativas.
- [ ] Medir instalaciones/uso para validar demanda antes de app nativa (React Native/Expo reutilizaría la misma API).

---

## 6. El embudo de leads para Trinium

- [x] "Un proyecto de Trinium" + CTA WhatsApp en footer (ya existe; ajustar copy conforme §1.1).
- [ ] `/desarrollado-por-trinium/`: caso de estudio con números reales de Analytics.
- [ ] El sitio como demo viviente: velocidad y diseño impecables.
- [ ] Futuro: `/directorio/` puede incluir negocios locales (monetización secundaria, sin canibalizar el enfoque ciudadano).

---

## 7. Fases de ejecución (v4 — camino crítico: confianza → seguridad → operación)

### Fase 1A — Fundación 🎯 *prioridad actual*

1. **Endurecimiento del admin (§5.1) — antes que cualquier CRUD** — se acredita con las 10 pruebas de aceptación M17.
2. **Seguridad perimetral (M15)**: cabeceras enforzadas, CSP Report-Only, rate limiting de escrituras existentes (incluida `propuestas`), revisión de secretos.
3. **Auditoría de la captura existente `propuestas` (M16)** como parte del legal mínimo.
4. ✅ **Definir grupos críticos por trámite y documentar la matriz de invalidación (M20)** — hecho 2026-07-16: `docs/modelo/matriz-invalidacion.md` v1.
5. **Congelar el modelo §2.2** cerrando B7-B9 (evidencias sin polimorfismo, identidad ligada a auth, separación editorial/comercial, honorarios únicos, proyección M18 definida, matriz M20 documentada) → **solo entonces** escribir migraciones.
6. Disclaimer inequívoco (§1.1) en sitio y componente `<DisclaimerOficial />`.
7. Rutas y páginas: `/dependencias/`, `/dependencias/[slug]/`, `/tramites/`, `/tramites/[slug]/` con SSG/ISR, `generateMetadata`, JSON-LD (§3.1).
8. Admin: CRUD de dependencias y trámites + flujo de verificación por grupo crítico (fuente, campos, responsable, evidencia clasificada).
9. Contenido piloto: **~10 dependencias + 5 trámites piloto con sus grupos EDITORIALES verificados extremo a extremo** (B8: la representación no bloquea). CTA de gestoría: `oculto`. *(La investigación editorial empieza desde ya en la plantilla de proveniencia de §2.2 y se importa tras las migraciones.)*
10. Legal mínimo del sitio informativo: `/acerca-de/`, `/privacidad/` (incluye lo hallado en M16), `/terminos/` base.

**Salida (criterios controlables, §3.5)**: checklist M17 aprobado (10/10) · pruebas **RLS-1** (acceso directo anónimo a privadas/borradores denegado) y **RLS-2** (vía proyección/API denegado) aprobadas · 5 fichas piloto publicadas con grupos editoriales verificados · antigüedad por sección visible en la ficha (M24) · `propuestas` y aviso de privacidad regularizados (M16) · URLs rastreables, canonical y schema válidos · sitemap aceptado · CWV dentro de presupuesto.

### Fase 1B — Expansión de contenido

1. `/directorio/` + buscador del home (base).
2. Expansión editorial a 15-20 trámites (proceso de verificación ya probado en 1A).
3. Sitemap dinámico completo, OG images dinámicas, breadcrumbs, `next/font`.
4. Cron de **grupos** vencidos (B4) + cola de verificación en admin.
5. Home: buscador prominente + accesos a trámites/directorio (actualizar copy post-feria).

**Salida**: 15-20 trámites publicados con proveniencia · ciclo de verificación operando con el cron · accesibilidad WCAG 2.2 AA verificada en fichas.

### Fase 1C — Asistencia editorial con IA *(solo si 1B midió un cuello de botella real)*

1. Captura asistida por IA con controles de procedencia (§5.2, M10).
2. Borradores de guías/FAQs → `/guias/`.

### Fase 2 — Servicio de agentes (equipo propio, manual)

**Precondiciones (del dictamen, no negociables):** revisión jurídica completa (§1.2: matriz de representación con **ambos controles vigentes** —operativo y jurídico, M11—, términos, privacidad con encargados, reembolsos) · mínimo transaccional operativo (§5.3) · **diseño B6 implementado y probado**: tokens de un solo uso (hash, caducidad, revocación) y snapshot inmutable de la solicitud · canal seguro de documentos · tabla de retención aprobada · procedimiento de incidentes y ARCO · **piloto interno con expedientes ficticios y evidencia de borrado** · responsable operativo nominal por cada control.

1. `/agentes/` landing: qué hacemos, cómo funciona, disclaimers.
2. CTA por trámite: `oculto` → `proximamente` → `activo` solo con las condiciones de §2.1.9 aprobadas por trámite.
3. Proceso operativo documentado (recepción, carta poder, cobro, entrega, borrado con evidencia, quién toma cada solicitud).
4. Agilizadores: carta poder pre-llenada (PDF), respuestas rápidas WhatsApp Business, auto-respuesta fuera de horario.
5. Respuestas instantáneas en el buscador (§4) + botón de reportes ciudadanos.
6. Medir: clics en CTA por trámite (Vercel Analytics custom events).

**Salida (M25 — "sin incidentes" no acredita seguridad; puede ser bajo volumen o falta de detección):**
- Controles ejecutados y documentados en **todos** los expedientes de la muestra.
- **Cero documentos fuera del repositorio autorizado** (verificado, no asumido).
- Bitácora de accesos **reconciliada contra expedientes** (cada acceso corresponde a un expediente y rol válidos).
- Eliminaciones dentro del SLA de la tabla de retención, con evidencia.
- Incidentes detectados, clasificados y atendidos conforme al procedimiento — un incidente bien detectado y resuelto no impide cerrar la fase; **ocultarlo o no poder detectarlo, sí**.
- Muestreo/auditoría de expedientes cerrados.
- Datos de demanda por trámite (para decidir Fase 3).

### Fase 3 — Automatizar lo que la demanda justifique

1. `/agentes/solicitar/` con seguimiento de estatus sobre el proyecto transaccional.
2. Pagos en línea (Stripe/MercadoPago) si el volumen lo justifica.
3. Monitoreo automático de fuentes oficiales (hash) — automatiza la proveniencia manual existente desde 1A.
4. **Bot de IA por WhatsApp**:
   - Reutiliza el motor de respuestas del answer box: misma base, solo datos verificados.
   - Responde requisitos, costos, horarios y teléfonos **solo desde Supabase**; si el dato no está, lo dice y da el teléfono de la dependencia.
   - Requiere WhatsApp Business API (Meta Cloud API o BSP); decidir número.
   - Escala a humano ante intención de contratar o pregunta sin respuesta.
   - Conversaciones: registro mínimo, cubierto por aviso de privacidad.

### Fase 4 — PWA / app · evolución del servicio

1. PWA con la política de caché de §5.4.
2. App nativa solo con demanda validada.
3. **Red de agentes externos (marketplace)** solo si el volumen supera al equipo propio: alta verificada, asignación, comisión, calificación; relación mercantil definida con asesoría.

---

## 8. Riesgos y decisiones pendientes

| Riesgo / decisión | Nota |
|---|---|
| Precisión de la información | El modelo de proveniencia (§3.4) es el producto. Sin él no hay diferenciador. |
| Fricción con el municipio | Disclaimers inequívocos (§1.1), sin identidad gráfica municipal, tono colaborativo. |
| Política de reembolso | Definir con jurídico antes de Fase 2 (rechazo por causas del ciudadano vs. autoridad). |
| Responsable de verificación | Nominal, por control y por cadencia (90 días). Sin nombre no hay control. |
| Copy del home post-feria | El hero sigue en modo countdown; la feria terminó el 30-jun. Ajustar en Fase 1B. |
| Búsqueda client-side | Suficiente < 500 registros; re-evaluar con Supabase FTS si crece. |
| Bot de WhatsApp y frescura | El bot amplifica errores de datos. Depende de §3.4. Pendiente: proveedor de WhatsApp Business API y costo por conversación. |
| IA en la captura | Nunca publica directo; controles de procedencia M10 completos. |
| PWA vs. frescura | Resuelto por política §5.4; no lanzar PWA sin ella. |
| Conflicto entre fuentes | Regla M13 (§3.4): no afirmar el dato, mostrar "dato no confirmado" + vías oficiales, retirar campo/ficha si es indispensable, registrar resolución. |
| Retiro de dependencias | Retirar una dependencia con trámites publicados queda bloqueado hasta reasignar o retirar sus trámites (definido en §2.2). |

---

## 9. Condiciones de GO (dictámenes 2026-07-12: v2, v3 y v4)

**Dictamen vigente (tercera auditoría): GO CONDICIONADO para continuar Fase 1A.**

| Puerta | Estado |
|---|---|
| Endurecer admin, seguridad perimetral, auditar `propuestas` | **GO** |
| Investigación editorial con plantilla de proveniencia | **GO** |
| Diseño de rutas y prototipos sin publicar | **GO** |
| Definir grupos críticos y matriz de invalidación (M20) | **GO** |
| Congelar §2.2 | NO GO hasta B7-B9 |
| Ejecutar migraciones | NO GO — ver condiciones abajo |
| Publicar las 5 fichas piloto | NO GO — ver condiciones abajo |
| Preparar/lanzar Fase 2 comercial | NO GO (B6 + precondiciones) |
| Recibir documentos reales | NO GO |
| Fases 3-4 | No evaluables; dependen de validar 1-2 |

**NO GO a migraciones hasta que:**
1. `*_evidencias` tenga FK real sin polimorfismo (B7).
2. `admin_usuarios` esté ligado a la identidad autenticada (B9).
3. Preparación editorial y comercial estén separadas (B8).
4. Se elimine la duplicidad de honorarios (M19).
5. La proyección pública esté definida con sus pruebas RLS (M18).
6. ✅ La matriz de invalidación por cambio esté documentada (M20) — `docs/modelo/matriz-invalidacion.md` v1 (2026-07-16).

**NO GO a publicación hasta que, además:**
1. Pasen las diez pruebas del admin (M17).
2. Pasen las pruebas RLS-1 (directa) y RLS-2 (vía proyección/API).
3. Los grupos editoriales obligatorios estén verificados (B8).
4. La interfaz comunique la antigüedad por sección (M24).
5. `propuestas` y el aviso de privacidad actual estén regularizados (M16).

**GO pleno a Fase 1** cuando exista evidencia documental de:
1. Autenticación administrativa corregida antes de ampliar el CRUD (pruebas M17).
2. Modelo de fuentes, responsables e historial de verificación.
3. Fase 1 recortada (1A/1B/1C) con criterios de aceptación controlables.
4. CTA comercial desactivado hasta que el servicio sea operable.
5. Objetivos SEO corregidos (sin SearchAction/FAQ/HowTo como activos visuales).
6. Disclaimer inequívoco.
7. Cinco fichas piloto verificadas extremo a extremo.
8. **La frescura se calcula por campo crítico y los cambios editoriales invalidan su verificación (B4).**
9. **Todas las relaciones tienen integridad referencial demostrable (B5).**
10. **Las políticas RLS de tablas hijas impiden exponer datos de borradores (B5).**
11. **Fuentes, evidencias, notas, autores e historial son privados por defecto (B5/M14).**
12. **Seguridad perimetral asignada y captura existente de `propuestas` auditada (M15/M16).**

**GO a Fase 2 comercial** únicamente después de:
1. Revisión jurídica de poderes (ambos controles M11 vigentes), términos, privacidad y reembolsos.
2. Arquitectura transaccional mínima operativa.
3. Canal seguro de documentos con el diseño B6 (tokens hasheados, caducidad, revocación, snapshot inmutable de solicitud).
4. Política concreta de retención y eliminación.
5. Procedimiento de incidentes y derechos de titulares (ARCO).
6. Piloto interno con expedientes ficticios y evidencia de borrado.
7. Responsable operativo nominal por cada control.

**Captura de documentos o datos personales**: NO GO hasta cumplir todo lo anterior. **Fases 3-4**: se evalúan tras validar Fases 1-2.
