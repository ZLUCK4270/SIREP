/**
 * Responsabilidad: probar el filtrado y el orden de la bandeja.
 * Existe porque el orden por defecto decide qué reporte se revisa primero y una
 * búsqueda mal normalizada esconde reportes que el técnico sabe que existen.
 */

import { describe, expect, it } from "vitest";
import type { IdCampo } from "@/features/revision/types/campos";
import type {
  CampoReporte,
  Confianza,
  EstadoEscaneo,
  EstadoRevisionCampo,
  OrigenReporte,
  Reporte,
} from "@/features/revision/types/dominio";
import {
  coincideNumeroReporte,
  filtrarReportes,
  hayFiltrosActivos,
} from "./filtros";
import { ordenarReportes } from "./orden";

function crearCampo(
  id: IdCampo,
  estado: EstadoRevisionCampo,
  confianza: Confianza = "media",
): CampoReporte {
  return {
    id,
    valor_modelo: "valor",
    confianza,
    no_leido: false,
    valor_corregido: null,
    estado_revision: estado,
    revisado_por: null,
    revisado_en: null,
    corregido_por: null,
    corregido_en: null,
  };
}

function crearReporte(
  numero: string,
  opciones: {
    estado?: EstadoEscaneo;
    origen?: OrigenReporte;
    actualizado?: string;
    campos?: CampoReporte[];
  } = {},
): Reporte {
  const actualizado = opciones.actualizado ?? "2026-10-01T10:00:00-03:00";
  return {
    id: `rep-${numero}`,
    numero_reporte: numero,
    numero_talonario: numero,
    cliente: "Cliente de prueba",
    equipo: "Equipo",
    tecnico: "Téc. Prueba",
    fecha_reporte: "2026-10-01",
    origen: opciones.origen ?? "historico",
    estado: opciones.estado ?? "procesado",
    diseno_talonario: "talonario-go-service-carta",
    escaneo: {
      id: `esc-${numero}`,
      numero_reporte: numero,
      ruta_original: `empresa/${numero}_orig.pdf`,
      paginas_urls: [],
      paginas: 2,
      enviado_por: "Secretaría",
      canal: "telegram",
      estado: opciones.estado ?? "procesado",
      recibido_en: "2026-10-01T09:00:00-03:00",
      procesado_en: "2026-10-01T09:02:00-03:00",
    },
    campos: opciones.campos ?? [],
    creado_en: "2026-10-01T09:00:00-03:00",
    actualizado_en: actualizado,
    completado_en: null,
  };
}

const FILTROS_VACIOS = { busqueda: "", estado: "todos", origen: "todos" } as const;

describe("coincideNumeroReporte", () => {
  it("encuentra con o sin ceros y con separadores de escritura", () => {
    expect(coincideNumeroReporte("000845", "845")).toBe(true);
    expect(coincideNumeroReporte("000845", "000845")).toBe(true);
    expect(coincideNumeroReporte("000845", "N° 000.845")).toBe(true);
    expect(coincideNumeroReporte("000845", " 845 ")).toBe(true);
  });

  it("no coincide con otro número ni con texto sin dígitos", () => {
    expect(coincideNumeroReporte("000845", "846")).toBe(false);
    expect(coincideNumeroReporte("000845", "abc")).toBe(false);
  });

  it("una búsqueda vacía no filtra", () => {
    expect(coincideNumeroReporte("000845", "")).toBe(true);
    expect(coincideNumeroReporte("000845", "   ")).toBe(true);
  });
});

describe("filtrarReportes", () => {
  const reportes = [
    crearReporte("000845", { estado: "procesado", origen: "historico" }),
    crearReporte("000912", { estado: "completo", origen: "sistema" }),
    crearReporte("000901", { estado: "en_revision", origen: "sistema" }),
  ];

  it("combina estado y origen", () => {
    const resultado = filtrarReportes(reportes, {
      ...FILTROS_VACIOS,
      estado: "en_revision",
      origen: "sistema",
    });
    expect(resultado.map((reporte) => reporte.numero_reporte)).toEqual([
      "000901",
    ]);
  });

  it("filtra por búsqueda sin importar los ceros iniciales", () => {
    const resultado = filtrarReportes(reportes, {
      ...FILTROS_VACIOS,
      busqueda: "845",
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.numero_reporte).toBe("000845");
  });

  it("devuelve vacío cuando no hay coincidencias", () => {
    const resultado = filtrarReportes(reportes, {
      ...FILTROS_VACIOS,
      busqueda: "999",
    });
    expect(resultado).toEqual([]);
  });

  it("detecta si hay filtros activos", () => {
    expect(hayFiltrosActivos(FILTROS_VACIOS)).toBe(false);
    expect(
      hayFiltrosActivos({ ...FILTROS_VACIOS, estado: "completo" }),
    ).toBe(true);
    expect(hayFiltrosActivos({ ...FILTROS_VACIOS, busqueda: "  " })).toBe(false);
  });
});

describe("ordenarReportes", () => {
  const conDudosos = (cantidad: number, estado: EstadoEscaneo = "procesado") =>
    crearReporte(`00090${cantidad}`, {
      estado,
      campos: Array.from({ length: cantidad }, () =>
        crearCampo("empresa", "pendiente"),
      ),
    });

  it("pone más campos dudosos primero por defecto", () => {
    const reportes = [conDudosos(1), conDudosos(4), conDudosos(2)];
    const ordenados = ordenarReportes(reportes, "dudosos");
    expect(
      ordenados.map((reporte) => reporte.campos.filter((c) => c.estado_revision === "pendiente").length),
    ).toEqual([4, 2, 1]);
  });

  it("manda los reportes completos al final cuando no hay dudosos", () => {
    const completo = crearReporte("000800", { estado: "completo" });
    const recibido = crearReporte("000700", { estado: "recibido" });
    const ordenados = ordenarReportes([completo, recibido], "dudosos");
    expect(ordenados.map((reporte) => reporte.estado)).toEqual([
      "recibido",
      "completo",
    ]);
  });

  it("ordena por número de reporte", () => {
    const reportes = [
      crearReporte("000912"),
      crearReporte("000845"),
      crearReporte("000901"),
    ];
    expect(
      ordenarReportes(reportes, "numero").map((reporte) => reporte.numero_reporte),
    ).toEqual(["000845", "000901", "000912"]);
  });

  it("ordena por actualización sin mutar el arreglo original", () => {
    const viejo = crearReporte("000845", {
      actualizado: "2026-10-01T10:00:00-03:00",
    });
    const nuevo = crearReporte("000846", {
      actualizado: "2026-11-01T10:00:00-03:00",
    });
    const original = [viejo, nuevo];

    expect(
      ordenarReportes(original, "recientes").map((r) => r.numero_reporte),
    ).toEqual(["000846", "000845"]);
    expect(original.map((r) => r.numero_reporte)).toEqual(["000845", "000846"]);
  });
});