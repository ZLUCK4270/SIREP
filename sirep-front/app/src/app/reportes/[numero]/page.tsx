/**
 * Responsabilidad: página de servidor para la ruta `/reportes/[numero]`.
 * Los parámetros de la ruta se leen dentro de un componente envuelto en
 * Suspense: con `cacheComponents` activo, leerlos fuera impide prerenderizar la
 * página y el build de producción falla.
 */

import { Suspense } from "react";
import { CargandoRevision } from "@/features/revision/components/correccion/estados-revision";
import { VistaCorreccion } from "@/features/revision/components/correccion/vista-correccion";

interface PaginaReporteProps {
  params: Promise<{ numero: string }>;
}

async function ContenidoReporte({ params }: PaginaReporteProps) {
  const { numero } = await params;
  return <VistaCorreccion numero={numero} />;
}

export default function PaginaReporte({ params }: PaginaReporteProps) {
  return (
    <Suspense fallback={<CargandoRevision />}>
      <ContenidoReporte params={params} />
    </Suspense>
  );
}
