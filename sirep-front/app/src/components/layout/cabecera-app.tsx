/**
 * Responsabilidad: cabecera global de la aplicación.
 * Existe para que en cualquier pantalla se vea de dónde viene el trabajo
 * (SIREP, bandeja) y quién firma las revisiones, que es lo que hace creíble
 * la auditoría de cada campo.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Map, ScanLine } from "lucide-react";

import { MOSTRAR_CALIBRACION } from "@/config/entorno";
import { USUARIO_ACTUAL } from "@/config/sesion";

import { IndicadorEnVivo } from "./indicador-en-vivo";

function Marca() {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-petrol-600 to-petrol-700 text-paper shadow-lift ring-1 ring-inset ring-white/20"
    >
      <ScanLine className="size-[1.15rem]" strokeWidth={2.25} />
    </span>
  );
}

function clasesEnlace(activo: boolean): string {
  return [
    "relative flex h-9 items-center gap-2 rounded-md px-3 text-meta font-medium",
    "transition-colors duration-150 ease-[var(--ease-salida)]",
    activo
      ? "bg-petrol-50 text-petrol-700"
      : "text-muted hover:bg-sunken hover:text-ink",
  ].join(" ");
}

export function CabeceraApp() {
  const ruta = usePathname();
  const enBandeja = ruta === "/" || ruta.startsWith("/reportes");
  const enCalibracion = ruta.startsWith("/dev/regiones");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-raised/80 backdrop-blur-xl">
      {/* Filo de color: identifica el producto sin ocupar altura */}
      <div
        aria-hidden="true"
        className="h-0.5 bg-linear-to-r from-petrol-600 via-petrol-200 to-transparent"
      />
      <div className="mx-auto flex h-(--header-h) max-w-(--layout-max) items-center gap-4 px-(--space-gutter)">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md text-ink"
          aria-label="SIREP, ir a la bandeja de revisión"
        >
          <Marca />
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">
              SIREP
            </span>
            <span className="mt-1 text-micro uppercase tracking-label text-faint">
              Digitalización de reportes
            </span>
          </span>
        </Link>

        <nav
          aria-label="Secciones principales"
          className="ml-auto flex items-center gap-1"
        >
          <Link
            href="/"
            aria-current={enBandeja ? "page" : undefined}
            className={clasesEnlace(enBandeja)}
          >
            <Inbox className="size-4" aria-hidden="true" />
            <span className="max-sm:sr-only">Bandeja</span>
          </Link>
          {MOSTRAR_CALIBRACION ? (
            <Link
              href="/dev/regiones"
              aria-current={enCalibracion ? "page" : undefined}
              className={clasesEnlace(enCalibracion)}
            >
              <Map className="size-4" aria-hidden="true" />
              <span className="max-sm:sr-only">Regiones</span>
            </Link>
          ) : null}
        </nav>

        <IndicadorEnVivo />

        <div className="flex items-center gap-2.5 border-l border-line pl-4">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full bg-petrol-50 font-mono text-micro font-semibold text-petrol-700 ring-1 ring-inset ring-petrol-200"
          >
            {USUARIO_ACTUAL.iniciales}
          </span>
          <span className="hidden flex-col leading-none md:flex">
            <span className="text-meta font-medium text-ink">
              {USUARIO_ACTUAL.nombre}
            </span>
            <span className="mt-1 text-micro uppercase tracking-label text-faint">
              {USUARIO_ACTUAL.rol}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}