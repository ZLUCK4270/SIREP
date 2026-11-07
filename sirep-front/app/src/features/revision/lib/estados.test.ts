/**
 * Responsabilidad: probar la regla de estado derivado del reporte.
 * Existe porque es la regla que decide cuándo un reporte aparece como completo
 * en la bandeja; un error acá haría que el taller crea revisar lo que no.
 */

import { describe, expect, it } from "vitest";

import type { CampoReporte } from "@/features/revision/types/dominio";

import { derivarEstadoReporte } from "./estados";

function campo(
  estado: CampoReporte["estado_revision"],
  id: CampoReporte["id"] = "empresa",
): CampoReporte {
  return {
    id,
    valor_modelo: "x",
    confianza: "alta",
    no_leido: false,
    valor_corregido: null,
    estado_revision: estado,
    revisado_por: null,
    revisado_en: null,
    corregido_por: null,
    corregido_en: null,
  };
}

describe("derivarEstadoReporte", () => {
  it("es recibido mientras el modelo no haya leído el escaneo", () => {
    expect(
      derivarEstadoReporte([campo("auto")], { procesado: false }),
    ).toBe("recibido");
  });

  it("es procesado cuando hay pendientes y nadie intervino", () => {
    expect(
      derivarEstadoReporte([campo("auto"), campo("pendiente")], {
        procesado: true,
      }),
    ).toBe("procesado");
  });

  it("es en revisión cuando hay pendientes y alguien ya resolvió otro", () => {
    expect(
      derivarEstadoReporte(
        [campo("pendiente"), campo("confirmado", "fecha")],
        { procesado: true },
      ),
    ).toBe("en_revision");
  });

  it("es completo cuando no queda ningún pendiente", () => {
    expect(
      derivarEstadoReporte(
        [campo("confirmado"), campo("corregido", "fecha"), campo("ilegible", "equipo")],
        { procesado: true },
      ),
    ).toBe("completo");
  });

  it("no cuenta la lectura automática como intervención humana", () => {
    expect(
      derivarEstadoReporte(
        [campo("auto"), campo("pendiente", "fecha")],
        { procesado: true },
      ),
    ).toBe("procesado");
  });
});
