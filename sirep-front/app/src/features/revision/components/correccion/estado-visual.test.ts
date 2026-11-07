/**
 * Responsabilidad: probar las dos decisiones visuales que comparten la tarjeta
 * de campo, el resaltado del visor y el cierre del reporte.
 * Existe porque si la tarjeta pinta un campo de verde y el visor lo resalta de
 * ámbar, el técnico no sabe en cuál creer; y porque un escaneo recién recibido
 * no debe mostrar un cierre que todavía no ocurrió.
 */

import { describe, expect, it } from "vitest";

import type {
  CampoReporte,
  Confianza,
  EstadoRevisionCampo,
  PendientesRevision,
} from "@/features/revision/types/dominio";

import { hayCierre, tonoDeCampo } from "./estado-visual";

function crearCampo(
  estado: EstadoRevisionCampo,
  opciones: { confianza?: Confianza | null; noLeido?: boolean } = {},
): CampoReporte {
  return {
    id: "empresa",
    valor_modelo: "Ferretería San Martín",
    confianza: opciones.confianza ?? "media",
    no_leido: opciones.noLeido ?? false,
    valor_corregido: null,
    estado_revision: estado,
    revisado_por: null,
    revisado_en: null,
    corregido_por: null,
    corregido_en: null,
  };
}

function crearPendientes(
  total: number,
  resueltos: number,
  dudosos: number,
): PendientesRevision {
  return { total, resueltos, dudosos };
}

describe("tonoDeCampo", () => {
  it("pinta de petróleo la lectura que nadie revisó", () => {
    expect(tonoDeCampo(crearCampo("auto"))).toBe("petrol");
  });

  it("pinta de ámbar un pendiente de confianza media", () => {
    expect(tonoDeCampo(crearCampo("pendiente", { confianza: "media" }))).toBe(
      "amber",
    );
  });

  it("pinta de ladrillo un pendiente de confianza baja", () => {
    expect(tonoDeCampo(crearCampo("pendiente", { confianza: "baja" }))).toBe(
      "brick",
    );
  });

  it("pinta de ladrillo un pendiente que nadie pudo leer", () => {
    expect(tonoDeCampo(crearCampo("pendiente", { noLeido: true }))).toBe(
      "brick",
    );
  });

  it("pinta de verde lo que resolvió una persona", () => {
    expect(tonoDeCampo(crearCampo("confirmado"))).toBe("green");
    expect(tonoDeCampo(crearCampo("corregido"))).toBe("green");
  });

  it("pinta de ladrillo lo marcado como ilegible", () => {
    expect(tonoDeCampo(crearCampo("ilegible"))).toBe("brick");
  });
});

describe("hayCierre", () => {
  it("cierra cuando no queda ningún dudoso pendiente", () => {
    expect(hayCierre(crearPendientes(5, 5, 0), "completo")).toBe(true);
  });

  it("no cierra mientras haya dudosos pendientes", () => {
    expect(hayCierre(crearPendientes(5, 3, 2), "en_revision")).toBe(false);
  });

  it("no cierra un escaneo que el modelo todavía no leyó", () => {
    expect(hayCierre(crearPendientes(0, 0, 0), "recibido")).toBe(false);
  });

  it("cierra un reporte sin dudosos ya leído por el modelo", () => {
    expect(hayCierre(crearPendientes(0, 0, 0), "completo")).toBe(true);
  });
});
