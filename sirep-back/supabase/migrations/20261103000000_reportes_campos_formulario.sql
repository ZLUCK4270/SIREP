-- ==============================================================================
-- SIREP: columnas del formulario físico que la tabla `reportes` aún no tenía
-- ==============================================================================
-- El bot ya extrae estos campos del papel, pero solo se guardaban dentro del JSON
-- `campos_extraidos`: no se podían consultar, filtrar ni exportar. Se agregan como
-- columnas opcionales (el histórico los trae del papel; los reportes nuevos de RP-TECH
-- pueden dejarlos vacíos).
--
-- PROPUESTA para la reunión con Adrián (RP-TECH): los nombres y tipos finales se
-- acuerdan allí y el cambio definitivo se hace como migración en el repo de RP-TECH.

alter table public.reportes
  add column if not exists direccion text,
  add column if not exists motivo text,
  add column if not exists estado_equipo text,   -- casillas "Operativo / Inoperativo" tal como las leyó el modelo
  add column if not exists conclusion text,
  add column if not exists recomendaciones text,
  add column if not exists hora_llegada text,    -- texto: el papel trae "4:55" sin AM/PM ni fecha
  add column if not exists hora_salida text;

-- El reporte se abre desde la bandeja por su N° de talonario.
create index if not exists idx_reportes_estado on public.reportes(estado_reporte);
