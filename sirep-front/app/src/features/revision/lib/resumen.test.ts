/**
 * Responsabilidad: probar el cálculo del resumen superior de la bandeja
 * (reportes pendientes, campos dudosos totales, completados hoy y total).
 * Existe porque estas tres cifras deciden la jornada del técnico: un pendiente
 * mal contado hace que un reporte se pierda, un dudoso que no se suma esconde
 * trabajo y un "completados hoy" que mira la fecha equivocada desconfía de la
 * herramienta.
 */

import { describe, expect, it, vi } from "vitest";

import type {
  CampoReporte,
  Confianza,
  EstadoRevisionCampo,
  Reporte,
} from "@/features/revision/types/dominio";

import { calcularResumenBandeja } from "./resumen";

function crearCampo(
  confianza: Confianza | null,
  estado: EstadoRevisionCampo = "auto",
  noLeido = false,
): CampoReporte {
  return {
    id: "empresa",
    valor_modelo: "valor",
    confianza,
    no_leido: noLeido,
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
    estado?: Reporte["estado"];
    campos?: CampoReporte[];
    actualizado_en?: string;
    completado_en?: string | null;
  } = {},
): Reporte {
  return {
    id: `rep-${numero}`,
    numero_reporte: numero,
    numero_talonario: numero,
    cliente: "Cliente de prueba",
    equipo: "Equipo",
    tecnico: "Téc. Prueba",
    fecha_reporte: "2026-10-01",
    origen: "historico",
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
    actualizado_en: opciones.actualizado_en ?? "2026-10-01T10:00:00-03:00",
    completado_en: opciones.completado_en ?? null,
  };
}

/**
 * Construye el ISO en la fecha local pedida: partir de la fecha local y no de
 * un string escrito a mano hace que la prueba valga en cualquier zona horaria.
 */
function isoLocal(
  anio: number,
  mes: number,
  dia: number,
  hora = 12,
  minutos = 0,
): string {
  return new Date(anio, mes - 1, dia, hora, minutos).toISOString();
}

describe("calcularResumenBandeja", () => {
  it("cuenta como pendiente todo reporte que todavía no está completo", () => {
    const reportes = [
      crearReporte("000700", { estado: "recibido" }),
      crearReporte("000701", { estado: "procesado" }),
      crearReporte("000702", { estado: "en_revision" }),
      crearReporte("000703", { estado: "completo" }),
    ];

    const resumen = calcularResumenBandeja(reportes, new Date(2026, 10, 2));

    // "Recibido" también cuenta: el escaneo espera lectura, es trabajo pendiente.
    expect(resumen.reportes_pendientes).toBe(3);
    expect(resumen.total).toBe(4);
  });

  it("suma los campos dudosos por confianza de lectura, aunque ya estén resueltos", () => {
    const reportes = [
      crearReporte("000845", {
        campos: [
          crearCampo("media"),
          crearCampo("baja"),
          crearCampo(null, "pendiente", true),
          crearCampo("alta"),
          crearCampo(null, "auto", false),
        ],
      }),
      crearReporte("000912", {
        campos: [crearCampo("media", "confirmado"), crearCampo("baja", "corregido")],
      }),
    ];

    const resumen = calcularResumenBandeja(reportes, new Date(2026, 10, 2));

    // Media, baja y no leído son dudosas; alta y null sin no_leído no lo son.
    // Los resueltos siguen sumando: la cifra mide material dudoso del archivo.
    expect(resumen.campos_dudosos).toBe(5);
  });

  it("cuenta completados hoy por completado_en en fecha local, no por actualizado_en", () => {
    const hoy = new Date(2026, 10, 2);
    const reportes = [
      // Cierra hoy casi a medianoche: en otra zona horaria el ISO ya cambió de
      // día, pero para el técnico fue cierre de hoy.
      crearReporte("000901", {
        estado: "completo",
        completado_en: isoLocal(2026, 11, 2, 23, 30),
      }),
      crearReporte("000902", {
        estado: "completo",
        completado_en: isoLocal(2026, 11, 2, 0, 15),
      }),
      crearReporte("000903", {
        estado: "completo",
        completado_en: isoLocal(2026, 11, 1, 18),
      }),
      // Se actualizó hoy pero nunca cerró: no es un cierre de hoy.
      crearReporte("000904", {
        estado: "en_revision",
        actualizado_en: isoLocal(2026, 11, 2, 9),
        completado_en: null,
      }),
    ];

    const resumen = calcularResumenBandeja(reportes, hoy);

    expect(resumen.completados).toBe(2);
  });

  it("por defecto toma como hoy la fecha del sistema", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 2, 15, 0, 0));
    try {
      const reportes = [
        crearReporte("000905", {
          estado: "completo",
          completado_en: isoLocal(2026, 11, 2, 10),
        }),
        crearReporte("000906", {
          estado: "completo",
          completado_en: isoLocal(2026, 11, 1, 10),
        }),
      ];

      expect(calcularResumenBandeja(reportes).completados).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("un archivo sin reportes devuelve cero en las cuatro cifras", () => {
    expect(calcularResumenBandeja([], new Date(2026, 10, 2))).toEqual({
      reportes_pendientes: 0,
      campos_dudosos: 0,
      completados: 0,
      total: 0,
    });
  });
});