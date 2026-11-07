-- ==============================================================================
-- SIREP: Migración Inicial de Escaneos y Reportes Históricos (RP-TECH)
-- Ejecutable limpiamente con: supabase db reset
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. Tabla de Escaneos de Reportes
create table if not exists public.escaneos (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid,
  numero_reporte text,
  ruta_original text not null,
  huella text not null, -- Hash SHA-256 del archivo escaneado original
  paginas integer not null default 1,
  enviado_por text,
  telegram_chat_id bigint,
  estado text not null default 'recibido'
    check (estado in ('recibido', 'procesado', 'en_revision', 'completo')),
  metadatos jsonb default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Índices requeridos
create unique index if not exists idx_escaneos_num_empresa 
  on public.escaneos(empresa_id, numero_reporte) 
  where numero_reporte is not null;

create index if not exists idx_escaneos_huella on public.escaneos(huella);
create index if not exists idx_escaneos_estado on public.escaneos(estado);

-- 2. Tabla de Reportes Técnicos (Alineada con RP-TECH para histórico)
create table if not exists public.reportes (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid,
  escaneo_id uuid references public.escaneos(id) on delete set null,
  numero_talonario text,
  origen text not null default 'historico'
    check (origen in ('historico', 'sistema')),
  cliente text,
  fecha date,
  serie_equipo text,
  procedimiento text,
  codigo_repuesto text,
  tecnico_asignado text,
  estado_reporte text not null default 'pendiente_revision'
    check (estado_reporte in ('pendiente_revision', 'aprobado', 'observado')),
  campos_extraidos jsonb default '{}'::jsonb,
  campos_dudosos text[] default array[]::text[],
  corregido_por text,
  fecha_correccion timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_reportes_talonario on public.reportes(numero_talonario);
create index if not exists idx_reportes_escaneo on public.reportes(escaneo_id);

-- 3. Bucket de almacenamiento para escaneos originales
insert into storage.buckets (id, name, public)
values ('escaneos-originales', 'escaneos-originales', false)
on conflict (id) do nothing;

