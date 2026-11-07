/**
 * Prueba de contrato con el backend: `RESPUESTA_BACKEND` es la respuesta real de
 * `GET /reportes/:numero` (generada procesando un reporte con `EscaneosService` y
 * pasándolo por `aReporteContrato`). Si el backend cambia el contrato o un campo
 * del formulario, esta prueba falla en el frontend antes de que lo haga la
 * bandeja en producción.
 */

import { describe, expect, it } from "vitest";

import { CAMPOS_POR_ID } from "@/config/campos-formulario";
import { obtenerMapa } from "@/config/regiones";
import { componerReporte, valorVigente } from "@/features/revision/lib/campos";
import { derivarEstadoReporte } from "@/features/revision/lib/estados";
import { calcularPendientes } from "@/features/revision/lib/dudosos";
import type { Reporte } from "@/features/revision/types/dominio";

const RESPUESTA_BACKEND = {
  "id": "reporte-ejemplo",
  "numero_reporte": "000214",
  "numero_talonario": "000214",
  "cliente": "Area 51",
  "equipo": "",
  "tecnico": "Angelo / Fabian",
  "fecha_reporte": "2026-02-03",
  "origen": "historico",
  "estado": "procesado",
  "diseno_talonario": "talonario-go-service-carta",
  "escaneo": {
    "id": "escaneo-ejemplo",
    "numero_reporte": "000214",
    "ruta_original": "00000000-0000-0000-0000-000000000000/1793699738913_000214_orig.pdf",
    "paginas": 1,
    "paginas_urls": [
      "https://firmada/pag1.png"
    ],
    "enviado_por": "secretaria",
    "canal": "telegram",
    "estado": "procesado",
    "recibido_en": "2026-11-03T09:55:39.221Z",
    "procesado_en": "2026-11-03T09:55:39.221Z"
  },
  "campos": [
    {
      "id": "tecnico",
      "valor_modelo": "Angelo / Fabian",
      "confianza": "alta",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "empresa",
      "valor_modelo": "Area 51",
      "confianza": "alta",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "fecha",
      "valor_modelo": "03/02/26",
      "confianza": "alta",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "telefono",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "direccion",
      "valor_modelo": "Garibaldi 123",
      "confianza": "media",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "contacto",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "equipo",
      "valor_modelo": null,
      "confianza": "baja",
      "no_leido": true,
      "valor_corregido": null,
      "estado_revision": "pendiente",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "motivo",
      "valor_modelo": "Equipo dañado",
      "confianza": "media",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "estado_del_equipo",
      "valor_modelo": null,
      "confianza": "baja",
      "no_leido": true,
      "valor_corregido": null,
      "estado_revision": "pendiente",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "ultimo_mantenimiento",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "limpieza_equipo",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "cabezales",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "sistema_proteccion",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "tinta",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "revision_linea_ln",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "revision_linea_lt",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "revision_linea_nt",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "operador",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "procedimiento",
      "valor_modelo": "Se revisó el anterior servicio...",
      "confianza": "media",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "conclusion",
      "valor_modelo": "Cambio de sensor",
      "confianza": "alta",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "recomendaciones",
      "valor_modelo": null,
      "confianza": "baja",
      "no_leido": true,
      "valor_corregido": null,
      "estado_revision": "pendiente",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "repuestos_tipo",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "codigo_repuesto",
      "valor_modelo": null,
      "confianza": "baja",
      "no_leido": true,
      "valor_corregido": null,
      "estado_revision": "pendiente",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "repuestos_descripcion",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "repuestos_cantidad",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "hora_llegada",
      "valor_modelo": "4:55",
      "confianza": "alta",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "hora_salida",
      "valor_modelo": "6:40",
      "confianza": "alta",
      "no_leido": false,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null
    },
    {
      "id": "garantia",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "facturado",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "firma_operador",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    },
    {
      "id": "firma_cliente",
      "valor_modelo": null,
      "confianza": "alta",
      "no_leido": false,
      "observacion": null,
      "valor_corregido": null,
      "estado_revision": "auto",
      "revisado_por": null,
      "revisado_en": null,
      "corregido_por": null,
      "corregido_en": null,
      "region": null
    }
  ],
  "creado_en": "2026-11-03T09:55:39.222Z",
  "actualizado_en": "2026-11-03T09:55:39.222Z",
  "completado_en": null
} as unknown as Reporte;

describe("contrato con el backend", () => {
  it("el diseño de talonario que declara el backend existe en el frontend", () => {
    expect(() => obtenerMapa(RESPUESTA_BACKEND.diseno_talonario)).not.toThrow();
  });

  it("cada campo que envía el backend tiene definición y región en el frontend", () => {
    const mapa = obtenerMapa(RESPUESTA_BACKEND.diseno_talonario);
    const vista = componerReporte(RESPUESTA_BACKEND, mapa);

    expect(vista.campos).toHaveLength(Object.keys(mapa.regiones).length);
    for (const campo of vista.campos) {
      expect(CAMPOS_POR_ID[campo.id], `definición de ${campo.id}`).toBeDefined();
      expect(campo.region, `región de ${campo.id}`).toBeDefined();
    }
  });

  it("el estado que calcula el backend coincide con la regla de la bandeja", () => {
    const estado = derivarEstadoReporte(RESPUESTA_BACKEND.campos, { procesado: true });
    expect(estado).toBe(RESPUESTA_BACKEND.estado);
  });

  it("los campos dudosos llegan como pendientes y los claros como automáticos", () => {
    const por = Object.fromEntries(RESPUESTA_BACKEND.campos.map((c) => [c.id, c]));
    expect(por.codigo_repuesto.estado_revision).toBe("pendiente");
    expect(por.codigo_repuesto.no_leido).toBe(true);
    expect(por.empresa.estado_revision).toBe("auto");
    expect(valorVigente(por.empresa)).toBe("Area 51");
    expect(calcularPendientes(RESPUESTA_BACKEND.campos).dudosos).toBeGreaterThan(0);
  });

  it("trae los enlaces de imagen que necesita el visor", () => {
    expect(RESPUESTA_BACKEND.escaneo.paginas_urls.length).toBeGreaterThan(0);
  });
});