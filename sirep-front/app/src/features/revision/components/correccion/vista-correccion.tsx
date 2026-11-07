/**
 * Responsabilidad: vista interactiva de cliente para la corrección de un reporte.
 * Recibe `numero: string` ya resuelto desde la página servidor, evitando
 * advertencias de prerendering en Next.js.
 */

"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { BarraAccionesReporte } from "@/features/revision/components/correccion/barra-acciones-reporte";
import { CabeceraReporte } from "@/features/revision/components/correccion/cabecera-reporte";
import {
  CargandoRevision,
  ErrorDeCarga,
  ReporteNoEncontrado,
} from "@/features/revision/components/correccion/estados-revision";
import { ModalImagenReal } from "@/features/revision/components/correccion/modal-imagen-real";
import { PanelCampos } from "@/features/revision/components/correccion/panel-campos";
import { ProgresoRevision } from "@/features/revision/components/correccion/progreso-revision";
import { HojaEscaneada } from "@/features/revision/components/escaneo/hoja-escaneada";
import { RecorteEscaneo } from "@/features/revision/components/escaneo/recorte";
import { calcularRecorte } from "@/features/revision/lib/recorte";
import { useRevisionReporte } from "@/features/revision/hooks/use-revision-reporte";
import type { NumeroPagina } from "@/features/revision/types/regiones";

interface VistaCorreccionProps {
  numero: string;
}

export function VistaCorreccion({ numero }: VistaCorreccionProps) {
  const revision = useRevisionReporte(numero);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [modalOriginal, setModalOriginal] = useState(false);
  const [paginaEscaneo, setPaginaEscaneo] = useState<NumeroPagina>(1);
  const [zoomNivel, setZoomNivel] = useState(1);
  // El recorte del campo activo es opcional: el resaltado sobre el propio
  // documento ya ubica el campo, así que solo se muestra si se pide con el ojo.
  const [verRecorte, setVerRecorte] = useState(false);

  if (revision.estado === "cargando") return <CargandoRevision />;
  if (revision.estado === "no_encontrado")
    return <ReporteNoEncontrado numero={numero} />;
  if (revision.estado === "error")
    return (
      <ErrorDeCarga
        mensaje={revision.mensajeError ?? "No se pudo cargar el reporte."}
        onReintentar={revision.recargar}
      />
    );
  if (!revision.reporte) return null;

  const reporte = revision.reporte;

  // Cada revisión se guarda en el servidor al instante (ver repositorio-api),
  // así que no hay "guardar" ni "revertir": deshacer es reabrir el campo.
  const totalPaginas = Math.max(
    reporte.mapa.paginas,
    reporte.escaneo.paginas_urls.length,
    reporte.escaneo.paginas,
    1,
  );

  const handleDescargarPDF = () => {
    const anterior = document.title;
    document.title = `Reporte_${reporte.numero_reporte}`;
    window.print();
    document.title = anterior;
  };

  return (
    <div className="mx-auto flex w-full max-w-(--layout-max) flex-col gap-4 px-(--space-gutter) pb-6 pt-3">
      {/* Barra de navegación rápida a la bandeja */}
      <nav aria-label="Navegación secundaria">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-meta font-medium text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver a la bandeja de revisión
        </Link>
      </nav>

      {/* Barra de herramientas superior */}
      <BarraAccionesReporte
        numeroReporte={reporte.numero_reporte}
        cliente={reporte.cliente}
        modoEdicion={modoEdicion}
        onAlternarEdicion={() => setModoEdicion((prev) => !prev)}
        onDescargarPDF={handleDescargarPDF}
        onVerImagenReal={() => setModalOriginal(true)}
      />

      {/* Cabecera contextual del reporte */}
      <CabeceraReporte reporte={reporte} />

      {/* Barra de progreso de revisión de campos dudosos */}
      <ProgresoRevision
        pendientes={revision.pendientes}
        ultimoResuelto={
          revision.ultimaAccion
            ? (reporte.campos.find((c) => c.id === revision.ultimaAccion)
              ?.definicion.etiqueta ?? null)
            : null
        }
        onDeshacer={() => void revision.deshacer()}
      />

      {/* Contenedor principal de dos paneles (Visor de Escaneo | Lista de Campos) */}
      <div
        id="espacio-de-trabajo"
        className="grid scroll-mt-[calc(var(--header-h)+0.5rem)] gap-5 lg:h-[calc(100dvh-var(--header-h)-1.5rem)] lg:min-h-[560px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]"
      >
        {/* Panel izquierdo: Visor de escaneo */}
        <section
          aria-label="Visor del escaneo"
          className="animar-entrada flex min-h-0 flex-col gap-3 rounded-md border border-line bg-paper p-4 shadow-xs lg:h-full"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="text-micro uppercase tracking-label font-medium text-muted">
                Visor de Escaneo
              </span>
              <span className="rounded-xs bg-sunken px-1.5 py-0.5 font-mono text-micro text-ink">
                Pág. {paginaEscaneo} de {totalPaginas}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVerRecorte((v) => !v)}
                aria-pressed={verRecorte}
                title={
                  verRecorte
                    ? "Ocultar el recorte del campo activo"
                    : "Ver el recorte del campo activo"
                }
                className={[
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-micro font-medium transition-colors duration-150 ease-[var(--ease-salida)]",
                  verRecorte
                    ? "border-petrol-200 bg-petrol-50 text-petrol-700"
                    : "border-line-strong bg-raised text-muted hover:bg-sunken hover:text-ink",
                ].join(" ")}
              >
                {verRecorte ? (
                  <EyeOff className="size-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="size-3.5" aria-hidden="true" />
                )}
                Recorte
              </button>

              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => setModalOriginal(true)}
                className="gap-1 text-micro"
              >
                <Maximize2 className="size-3" />
                Original
              </Boton>

              <div className="flex items-center rounded-xs border border-line p-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setZoomNivel((z) => Math.max(z - 0.2, 0.8))
                  }
                  title="Reducir zoom"
                  aria-label="Reducir zoom"
                  className="p-1 text-muted hover:text-ink"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="px-1 text-micro font-mono">
                  {Math.round(zoomNivel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setZoomNivel((z) => Math.min(z + 0.2, 2))
                  }
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                  className="p-1 text-muted hover:text-ink"
                >
                  <ZoomIn className="size-3.5" />
                </button>
              </div>

              {totalPaginas > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPaginaEscaneo((p) => Math.max(1, p - 1))}
                    disabled={paginaEscaneo === 1}
                    className="p-1 text-muted disabled:opacity-30 hover:text-ink"
                    title="Página anterior"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPaginaEscaneo((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaEscaneo === totalPaginas}
                    className="p-1 text-muted disabled:opacity-30 hover:text-ink"
                    title="Página siguiente"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Recorte del campo activo: solo a pedido (ojo) y de tamaño acotado */}
          {verRecorte && revision.campoActivo ? (
            <div
              key={revision.campoActivo.id}
              className="animar-aparecer shrink-0 rounded-xs border border-petrol-200 bg-petrol-50/50 px-2.5 py-2"
            >
              <p className="text-micro font-medium uppercase tracking-label text-petrol-800">
                {revision.campoActivo.definicion.etiqueta}
              </p>
              <div
                className="mt-1.5 overflow-hidden rounded-xs border border-petrol-300 bg-paper"
                style={{
                  // Altura máxima de ~6 rem sin deformar el recorte: el ancho
                  // se limita según la proporción del campo.
                  width: `min(100%, ${(
                    6 *
                    calcularRecorte(
                      revision.campoActivo.region,
                      reporte.mapa,
                    ).aspecto_ventana
                  ).toFixed(2)}rem)`,
                }}
              >
                <RecorteEscaneo
                  mapa={reporte.mapa}
                  region={revision.campoActivo.region}
                >
                  <HojaEscaneada
                    mapa={reporte.mapa}
                    pagina={revision.campoActivo.region.pagina}
                    reporte={reporte}
                  />
                </RecorteEscaneo>
              </div>
            </div>
          ) : null}

          {/* Lienzo del escaneo */}
          <div
            className="scroll-fino relative flex min-h-[420px] w-full items-start justify-center overflow-auto rounded-xs border border-line bg-sunken p-2 lg:min-h-0 lg:flex-1"
          >
            <div
              style={{
                transform: `scale(${zoomNivel})`,
                transformOrigin: "top center",
                transition: "transform 150ms ease-out",
                width: "100%",
                maxWidth: "600px",
              }}
            >
              <HojaEscaneada
                mapa={reporte.mapa}
                pagina={paginaEscaneo}
                reporte={reporte}
                resaltado={
                  revision.campoActivo
                    ? {
                      region: revision.campoActivo.region,
                      etiqueta: revision.campoActivo.definicion.etiqueta,
                      tono: "amber",
                    }
                    : null
                }
              />
            </div>
          </div>
        </section>

        {/* Panel derecho: Lista de campos con soporte de bloqueo */}
        <div className="animar-lado flex min-h-0 flex-col lg:h-full" style={{ "--retardo": 90 } as CSSProperties}>
          <PanelCampos
            reporte={reporte}
            grupos={revision.grupos}
            soloDudosos={revision.soloDudosos}
            campoActivo={revision.campoActivo}
            enCurso={revision.campoEnCurso !== null}
            errorAccion={revision.errorAccion}
            modoEdicion={modoEdicion}
            onCambiarVista={revision.cambiarVista}
            acciones={{
              seleccionar: revision.seleccionar,
              confirmar: (id) => void revision.confirmar(id),
              corregir: revision.corregir,
              ilegible: (id) => void revision.marcarIlegible(id),
              reabrir: (id) => void revision.reabrir(id),
              descartarError: revision.descartarError,
            }}
          />
        </div>
      </div>

      {/* Modal de Imagen Real (archivo físico escaneado) */}
      <ModalImagenReal
        abierto={modalOriginal}
        rutaImagen={reporte.escaneo.paginas_urls[paginaEscaneo - 1] ?? null}
        numeroReporte={reporte.numero_reporte}
        cliente={reporte.cliente}
        onCerrar={() => setModalOriginal(false)}
      />

      {/* Plantilla oculta para impresión y descarga como PDF */}
      <div className="hidden print:block print:p-8 bg-paper text-ink">
        <header className="border-b-2 border-ink pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider">
                GO SERVICE LATAM
              </h1>
              <p className="text-sm text-muted">
                Soporte Multimarcas · Servicio Técnico
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-mono font-bold text-brick-700">
                N° {reporte.numero_reporte}
              </h2>
              <p className="text-sm">Fecha: {reporte.fecha_reporte}</p>
            </div>
          </div>
        </header>

        <section className="my-6 grid grid-cols-2 gap-4 text-sm border-b border-line pb-4">
          <div>
            <p>
              <strong>Cliente / Empresa:</strong> {reporte.cliente}
            </p>
            <p>
              <strong>Equipo:</strong> {reporte.equipo}
            </p>
          </div>
          <div>
            <p>
              <strong>Técnico:</strong> {reporte.tecnico}
            </p>
            <p>
              <strong>Estado de revisión:</strong> {reporte.estado}
            </p>
          </div>
        </section>

        <section className="my-4">
          <h3 className="font-bold text-sm uppercase tracking-wide border-b border-line pb-1 mb-3">
            Detalle de Campos del Formulario
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-1">Campo</th>
                <th className="py-1">Valor Final</th>
                <th className="py-1">Lectura Modelo</th>
                <th className="py-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reporte.campos.map((campo) => (
                <tr key={campo.id} className="border-b border-line/50">
                  <td className="py-1.5 font-medium">
                    {campo.definicion?.etiqueta ?? campo.id}
                  </td>
                  <td className="py-1.5">
                    {campo.valor_corregido ??
                      campo.valor_modelo ??
                      "Sin valor"}
                  </td>
                  <td className="py-1.5 text-muted">
                    {campo.valor_modelo ?? "—"}
                  </td>
                  <td className="py-1.5 capitalize text-xs">
                    {campo.estado_revision}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-12 pt-6 border-t border-line flex justify-between text-xs text-muted">
          <div>Firma del Técnico: _______________________</div>
          <div>Conformidad del Cliente: _______________________</div>
        </footer>
      </div>
    </div>
  );
}