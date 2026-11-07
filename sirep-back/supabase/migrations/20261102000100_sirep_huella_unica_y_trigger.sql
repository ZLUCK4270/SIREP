-- ==============================================================================
-- SIREP: refuerzos de integridad sobre la migración inicial
-- ==============================================================================

-- 1. Un mismo archivo no puede registrarse dos veces por empresa. La verificación del
--    backend (consultar y luego insertar) deja una ventana si llegan dos envíos iguales
--    casi a la vez; este índice la cierra. Con el índice, la segunda inserción falla con
--    código 23505 y el bot responde "archivo ya enviado".
create unique index if not exists idx_escaneos_huella_empresa
  on public.escaneos(empresa_id, huella);

-- 2. actualizado_en se mantiene solo en cada UPDATE (igual que en RP-TECH).
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_escaneos_actualizado_en on public.escaneos;
create trigger trg_escaneos_actualizado_en
  before update on public.escaneos
  for each row execute function public.set_actualizado_en();

drop trigger if exists trg_reportes_actualizado_en on public.reportes;
create trigger trg_reportes_actualizado_en
  before update on public.reportes
  for each row execute function public.set_actualizado_en();