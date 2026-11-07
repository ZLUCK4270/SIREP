import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Reporte } from "@/features/revision/types/dominio";

import { ErrorRepositorio } from "./errores";
import { crearRepositorioApi } from "./repositorio-api";

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const reporte = { id: "r1", numero_reporte: "000214" } as unknown as Reporte;

describe("repositorio-api", () => {
  const fetchFalso = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchFalso);
  });

  afterEach(() => {
    fetchFalso.mockReset();
    vi.unstubAllGlobals();
  });

  it("lista los reportes desde GET /reportes", async () => {
    fetchFalso.mockResolvedValue(respuesta([reporte]));
    const lista = await crearRepositorioApi().listarReportes();

    expect(lista).toEqual([reporte]);
    expect(String(fetchFalso.mock.calls[0][0])).toMatch(/\/reportes$/);
  });

  it("obtiene un reporte y codifica el número en la URL", async () => {
    fetchFalso.mockResolvedValue(respuesta(reporte));
    await crearRepositorioApi().obtenerReporte("SN-ab12 cd");

    expect(String(fetchFalso.mock.calls[0][0])).toContain("/reportes/SN-ab12%20cd");
  });

  it("un reporte inexistente (404) devuelve null y no un error", async () => {
    fetchFalso.mockResolvedValue(respuesta({ message: "No existe" }, 404));
    expect(await crearRepositorioApi().obtenerReporte("999999")).toBeNull();
  });

  it("corregir envía PATCH con tipo, actor y valor", async () => {
    fetchFalso.mockResolvedValue(respuesta(reporte));
    await crearRepositorioApi().revisarCampo("000214", "codigo_repuesto", {
      tipo: "corregir",
      actor: "Ana",
      valor: "SN-4455",
    });

    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(String(url)).toMatch(/\/reportes\/000214\/campos\/codigo_repuesto$/);
    expect(opciones?.method).toBe("PATCH");
    expect(JSON.parse(String(opciones?.body))).toEqual({
      tipo: "corregir",
      actor: "Ana",
      valor: "SN-4455",
    });
  });

  it("confirmar no envía valor", async () => {
    fetchFalso.mockResolvedValue(respuesta(reporte));
    await crearRepositorioApi().revisarCampo("000214", "empresa", { tipo: "confirmar", actor: "Ana" });
    expect(JSON.parse(String(fetchFalso.mock.calls[0][1]?.body))).toEqual({ tipo: "confirmar", actor: "Ana" });
  });

  it("un 409 se traduce a conflicto con el mensaje del servidor", async () => {
    fetchFalso.mockResolvedValue(respuesta({ message: "El reporte cambió mientras lo revisabas." }, 409));
    const error = await crearRepositorioApi()
      .revisarCampo("000214", "empresa", { tipo: "confirmar", actor: "Ana" })
      .catch((e) => e);

    expect(error).toBeInstanceOf(ErrorRepositorio);
    expect(error.codigo).toBe("conflicto");
    expect(error.message).toContain("cambió mientras");
  });

  it("sin conexión con el backend se traduce a sin_conexion", async () => {
    fetchFalso.mockRejectedValue(new TypeError("fetch failed"));
    const error = await crearRepositorioApi().listarReportes().catch((e) => e);

    expect(error).toBeInstanceOf(ErrorRepositorio);
    expect(error.codigo).toBe("sin_conexion");
  });

  it("un error 500 no filtra detalles técnicos a la interfaz", async () => {
    fetchFalso.mockResolvedValue(respuesta({ message: "relation reportes does not exist" }, 500));
    const error = await crearRepositorioApi().listarReportes().catch((e) => e);

    expect(error.codigo).toBe("sin_conexion");
    expect(error.message).not.toContain("relation");
  });
});
