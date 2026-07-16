-- ============================================================
-- Fase 1B — Triggers de la matriz de invalidación (M20) + proyección pública (M18)
-- Deriva de docs/modelo/matriz-invalidacion.md §3 y docs/modelo/modelo-contenido-v1.md §7.
-- Precondición: 0002 (modelo de contenido).
-- Probar antes: pnpm probar-triggers.
--
-- Dos mecanismos:
--   A) INVALIDACIÓN: una edición editorial marca invalidada_en=now() en la
--      verificación del grupo afectado (directo + cascada). El grupo vuelve a la cola.
--   B) PROYECCIÓN: al cambiar una verificación, se recalcula verificacion_publica
--      (solo columnas seguras) para el grupo afectado. Vigente+confirmada ⇒ fecha; si no ⇒ se borra.
-- ============================================================

-- ------------------------------------------------------------
-- B) Proyección pública — recalcula (entidad, grupo) desde la verificación vigente
--    security definer: escribe la proyección; el camino de LECTURA anónima nunca la usa.
-- ------------------------------------------------------------
create or replace function fn_proyectar(_tipo text, _id uuid, _grupo text)
returns void language plpgsql security definer as $$
declare _fecha date;
begin
  if _tipo = 'tramite' then
    select max(verificado_en)::date into _fecha from tramite_verificaciones
      where tramite_id = _id and grupo::text = _grupo and invalidada_en is null and resultado = 'confirmado';
  elsif _tipo = 'dependencia' then
    select max(verificado_en)::date into _fecha from dependencia_verificaciones
      where dependencia_id = _id and grupo::text = _grupo and invalidada_en is null and resultado = 'confirmado';
  elsif _tipo = 'directorio' then
    select max(verificado_en)::date into _fecha from directorio_verificaciones
      where directorio_id = _id and grupo::text = _grupo and invalidada_en is null and resultado = 'confirmado';
  end if;

  if _fecha is null then
    delete from verificacion_publica where entidad_tipo = _tipo and entidad_id = _id and grupo = _grupo;
  else
    insert into verificacion_publica (entidad_tipo, entidad_id, grupo, fecha)
    values (_tipo, _id, _grupo, _fecha)
    on conflict (entidad_tipo, entidad_id, grupo) do update set fecha = excluded.fecha;
  end if;
end $$;

-- Triggers de verificación → mantienen la proyección
create or replace function trg_verif_tramite() returns trigger language plpgsql as $$
begin
  perform fn_proyectar('tramite', coalesce(new.tramite_id, old.tramite_id), coalesce(new.grupo, old.grupo)::text);
  return null;
end $$;
create trigger t_verif_tramite after insert or update or delete on tramite_verificaciones
  for each row execute function trg_verif_tramite();

create or replace function trg_verif_dependencia() returns trigger language plpgsql as $$
begin
  perform fn_proyectar('dependencia', coalesce(new.dependencia_id, old.dependencia_id), coalesce(new.grupo, old.grupo)::text);
  return null;
end $$;
create trigger t_verif_dependencia after insert or update or delete on dependencia_verificaciones
  for each row execute function trg_verif_dependencia();

create or replace function trg_verif_directorio() returns trigger language plpgsql as $$
begin
  perform fn_proyectar('directorio', coalesce(new.directorio_id, old.directorio_id), coalesce(new.grupo, old.grupo)::text);
  return null;
end $$;
create trigger t_verif_directorio after insert or update or delete on directorio_verificaciones
  for each row execute function trg_verif_directorio();

-- ------------------------------------------------------------
-- A) Invalidación — helpers
-- ------------------------------------------------------------
create or replace function fn_invalidar_tramite(_tramite_id uuid, _grupos text[])
returns void language plpgsql as $$
begin
  update tramite_verificaciones set invalidada_en = now()
    where tramite_id = _tramite_id and grupo::text = any(_grupos) and invalidada_en is null;
end $$;

create or replace function fn_invalidar_dependencia(_dependencia_id uuid, _grupos text[])
returns void language plpgsql as $$
begin
  update dependencia_verificaciones set invalidada_en = now()
    where dependencia_id = _dependencia_id and grupo::text = any(_grupos) and invalidada_en is null;
end $$;

create or replace function fn_invalidar_directorio(_directorio_id uuid, _grupos text[])
returns void language plpgsql as $$
begin
  update directorio_verificaciones set invalidada_en = now()
    where directorio_id = _directorio_id and grupo::text = any(_grupos) and invalidada_en is null;
end $$;

-- Cascada dependencia → sus trámites (contacto/ubicacion son grupos propios del trámite)
create or replace function fn_cascada_tramites(_dependencia_id uuid, _grupos text[])
returns void language plpgsql as $$
begin
  update tramite_verificaciones tv set invalidada_en = now()
    from tramites t
    where tv.tramite_id = t.id and t.dependencia_id = _dependencia_id
      and tv.grupo::text = any(_grupos) and tv.invalidada_en is null;
end $$;

-- Baja el CTA a revisión cuando cambia la preparación comercial (honorario/representación)
create or replace function fn_cta_a_revision(_tramite_id uuid)
returns void language plpgsql as $$
begin
  update tramites set cta_estado = 'proximamente' where id = _tramite_id and cta_estado = 'activo';
end $$;

-- ------------------------------------------------------------
-- A) Invalidación — triggers por origen (matriz §3)
-- ------------------------------------------------------------

-- Regla 1 y 6: tramites.requisitos → 'requisitos'; dependencia_id (re-vínculo) → 'contacto','ubicacion'
create or replace function trg_tramites_edicion() returns trigger language plpgsql as $$
begin
  if new.requisitos is distinct from old.requisitos then
    perform fn_invalidar_tramite(new.id, array['requisitos']);
  end if;
  if new.dependencia_id is distinct from old.dependencia_id then
    perform fn_invalidar_tramite(new.id, array['contacto','ubicacion']);
  end if;
  return null;
end $$;
create trigger t_tramites_edicion after update on tramites
  for each row execute function trg_tramites_edicion();

-- Regla 2 y 3: costos_tramite → 'costos'; honorario → además CTA a revisión
create or replace function trg_costos() returns trigger language plpgsql as $$
declare _tramite uuid := coalesce(new.tramite_id, old.tramite_id);
begin
  perform fn_invalidar_tramite(_tramite, array['costos']);
  if coalesce(new.categoria, old.categoria) = 'honorario' then
    perform fn_cta_a_revision(_tramite);
  end if;
  return null;
end $$;
create trigger t_costos after insert or update or delete on costos_tramite
  for each row execute function trg_costos();

-- Regla 4: tramite_horarios → 'horarios_propios'
create or replace function trg_tramite_horarios() returns trigger language plpgsql as $$
begin
  perform fn_invalidar_tramite(coalesce(new.tramite_id, old.tramite_id), array['horarios_propios']);
  return null;
end $$;
create trigger t_tramite_horarios after insert or update or delete on tramite_horarios
  for each row execute function trg_tramite_horarios();

-- Regla 5: representacion_tramite → invalida 'representacion' y baja el CTA (comercial, B8)
create or replace function trg_representacion() returns trigger language plpgsql as $$
declare _tramite uuid := coalesce(new.tramite_id, old.tramite_id);
begin
  perform fn_invalidar_tramite(_tramite, array['representacion']);
  perform fn_cta_a_revision(_tramite);
  return null;
end $$;
create trigger t_representacion after insert or update or delete on representacion_tramite
  for each row execute function trg_representacion();

-- Regla 7: dependencia_telefonos → dependencia 'contacto' + cascada trámites 'contacto'
create or replace function trg_dep_telefonos() returns trigger language plpgsql as $$
declare _dep uuid := coalesce(new.dependencia_id, old.dependencia_id);
begin
  perform fn_invalidar_dependencia(_dep, array['contacto']);
  perform fn_cascada_tramites(_dep, array['contacto']);
  return null;
end $$;
create trigger t_dep_telefonos after insert or update or delete on dependencia_telefonos
  for each row execute function trg_dep_telefonos();

-- Regla 8 y 9: dependencias.email/sitio → 'contacto'; direccion/lat/lng → 'ubicacion' (+ cascada)
create or replace function trg_dependencias_edicion() returns trigger language plpgsql as $$
begin
  if new.email is distinct from old.email or new.sitio_oficial_url is distinct from old.sitio_oficial_url then
    perform fn_invalidar_dependencia(new.id, array['contacto']);
    perform fn_cascada_tramites(new.id, array['contacto']);
  end if;
  if new.direccion is distinct from old.direccion or new.lat is distinct from old.lat or new.lng is distinct from old.lng then
    perform fn_invalidar_dependencia(new.id, array['ubicacion']);
    perform fn_cascada_tramites(new.id, array['ubicacion']);
  end if;
  return null;
end $$;
create trigger t_dependencias_edicion after update on dependencias
  for each row execute function trg_dependencias_edicion();

-- Regla 10 y 11: dependencia_horarios (+ excepciones) → dependencia 'horarios'.
-- Los trámites SIN horarios_propios consumen este grupo (M21): no hay fila de trámite que invalidar.
create or replace function trg_dep_horarios() returns trigger language plpgsql as $$
begin
  perform fn_invalidar_dependencia(coalesce(new.dependencia_id, old.dependencia_id), array['horarios']);
  return null;
end $$;
create trigger t_dep_horarios after insert or update or delete on dependencia_horarios
  for each row execute function trg_dep_horarios();
create trigger t_dep_horarios_exc after insert or update or delete on dependencia_horarios_excepciones
  for each row execute function trg_dep_horarios();

-- Regla 12: directorio_telefonos → directorio 'contacto'
create or replace function trg_dir_telefonos() returns trigger language plpgsql as $$
begin
  perform fn_invalidar_directorio(coalesce(new.directorio_id, old.directorio_id), array['contacto']);
  return null;
end $$;
create trigger t_dir_telefonos after insert or update or delete on directorio_telefonos
  for each row execute function trg_dir_telefonos();

-- Regla 13: directorio.direccion → directorio 'ubicacion'
create or replace function trg_directorio_edicion() returns trigger language plpgsql as $$
begin
  if new.direccion is distinct from old.direccion then
    perform fn_invalidar_directorio(new.id, array['ubicacion']);
  end if;
  return null;
end $$;
create trigger t_directorio_edicion after update on directorio
  for each row execute function trg_directorio_edicion();
