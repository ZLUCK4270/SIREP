/**
 * Responsabilidad: página raíz de la bandeja de revisión; compone resumen,
 * barra de herramientas y lista con el estado que corresponde.
 * Existe como compositor delgado: no contiene lógica de datos (vive en
 * `use-bandeja`) ni reglas de cálculo (viven en `lib/`), solo decide qué pieza
 * se renderiza según el estado de carga y los filtros activos.
 */

"use client";

import { BarraHerramientas } from "@/features/revision/components/bandeja/barra-herramientas";
import { EstadosBandeja } from "@/features/revision/components/bandeja/estados-bandeja";
import { ListaTarjetas } from "@/features/revision/components/bandeja/lista-tarjetas";
import { ResumenBandeja } from "@/features/revision/components/bandeja/resumen-bandeja";
import { TablaReportes } from "@/features/revision/components/bandeja/tabla-reportes";
import { useBandeja } from "@/features/revision/hooks/use-bandeja";

export default function PaginaBandeja() {
  const bandeja = useBandeja();

  // Resumen y barra solo con archivo cargado: durante la carga o el error
  // mostraría cifras en cero que parecieran ser verdad.
  const conArchivo =
    bandeja.estadoCarga === "listo" && bandeja.totalArchivo > 0;
  const conResultados = conArchivo && bandeja.reportes.length > 0;

  return (
    <div className="mx-auto w-full max-w-(--layout-max) px-(--space-gutter) pb-16">
      <header className="max-w-2xl pt-10 pb-7">
        <p className="mb-2 inline-flex items-center gap-2 text-micro font-medium uppercase tracking-label text-petrol-700">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-petrol-600" />
          Revisión técnica
        </p>
        <h1 className="text-display font-semibold tracking-tight text-ink">
          Bandeja de revisión
        </h1>
        <p className="mt-2 text-base text-muted">
          Reportes escaneados: el modelo lee el documento y solo lo dudoso
          espera tu revisión, junto al recorte del escaneo.
        </p>
      </header>

      {conArchivo ? (
        <>
          <ResumenBandeja resumen={bandeja.resumen} />
          <BarraHerramientas
            filtros={bandeja.filtros}
            orden={bandeja.orden}
            filtrosActivos={bandeja.filtrosActivos}
            resultados={bandeja.reportes.length}
            totalArchivo={bandeja.totalArchivo}
            onCambioBusqueda={bandeja.establecerBusqueda}
            onCambioEstado={bandeja.establecerEstado}
            onCambioOrigen={bandeja.establecerOrigen}
            onCambioOrden={bandeja.establecerOrden}
            onLimpiar={bandeja.limpiarFiltros}
          />
        </>
      ) : null}

      {bandeja.estadoCarga === "cargando" ? (
        <EstadosBandeja estado="cargando" />
      ) : null}

      {bandeja.estadoCarga === "error" ? (
        <EstadosBandeja estado="error" onReintentar={bandeja.reintentar} />
      ) : null}

      {bandeja.estadoCarga === "listo" && bandeja.totalArchivo === 0 ? (
        <EstadosBandeja estado="vacio" />
      ) : null}

      {conArchivo && bandeja.reportes.length === 0 ? (
        <EstadosBandeja
          estado="sin_resultados"
          onLimpiar={bandeja.limpiarFiltros}
        />
      ) : null}

      {conResultados ? (
        <>
          <TablaReportes reportes={bandeja.reportes} />
          <ListaTarjetas reportes={bandeja.reportes} />
        </>
      ) : null}
    </div>
  );
}
