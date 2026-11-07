# 📦 ÍNDICE Y MAPA DE CAMBIOS — SPRINT 2 (SIREP)

Esta carpeta consolida todos los entregables, código desarrollado, reportes de evaluación con IA, tablas comparativas y archivos de seguimiento producidos durante el **Sprint 2 (Prueba de Viabilidad y Estabilización Técnica)**.

---

## 📁 Estructura del Paquete `ENTREGA_SPRINT_2`

```text
ENTREGA_SPRINT_2/
├── 📄 INDICE_Y_MAPA_DE_CAMBIOS.md    <- Este documento (guía de entrega y defensa)
│
├── 📂 metricas_y_csv/               <- Resultados reales de las corridas con IA (UTF-8 con BOM)
│   ├── evaluacion_gemini_1600px.csv (Corrida completa 25/25 reportes, 99.7% precisión, $0.02785 USD)
│   ├── evaluacion_gemini_2400px.csv (Corrida completa 25/25 reportes, 99.4% precisión, $0.02789 USD)
│   └── evaluacion_openai_1600px.csv (Registro de incidencia FEEDBACK:SIREP-S2-T08-A por cuota)
│
├── 📂 documentacion/                <- Documentos técnicos oficiales e informes
│   ├── informe.md                   <- Informe Final de Viabilidad (T05) con costos y proyecciones
│   ├── RESUMEN_DIA_2.md             <- Resumen general de actividades y estado 100% completado
│   ├── tabla-comparacion-rptech.md  <- Matriz de 28 campos físicos vs Especificación v1 RP-TECH (T10)
│   ├── REVISION_CRUZADA_T10.md      <- Auditoría cruzada Frontend/Backend de campos y migraciones
│   └── VERIFICACION_T09.md          <- Auditoría de 0 residuos de SIREGG y 'gastos' (T09)
│
├── 📂 codigo_desarrollado/          <- Piezas de software y pruebas construidas en este sprint
│   ├── evaluar-muestra.mjs          <- Script CLI de evaluación por lotes y renderizador PDF
│   ├── normalizacion.ts             <- Motor de normalización y similitud Sørensen-Dice
│   └── normalizacion.spec.ts        <- Suite de 16 pruebas unitarias automáticas
│
├── 📂 seguimiento/                  <- Control individual diario y checklists de cada rol
│   ├── luciano/ (Backend 1)         <- checklist.md + diario/2026-11-06.md
│   ├── kevin/   (Backend 2)         <- checklist.md + diario/2026-11-06.md
│   └── flavio/  (Frontend)          <- checklist.md + diario/2026-11-06.md
│
└── 📂 bundles/                      <- Paquetes Git con todo el historial de ramas y commits
    ├── sirep-back.bundle
    └── sirep-front.bundle
```

---

## 🛠️ Mapa Detallado de Cambios: Qué se hizo y Dónde

### 1. Backend 1 — Luciano (`SIREP-S2-T07`)
* **Archivo Creado:** `sirep-back/scripts/evaluar-muestra.mjs`
  * **Qué hace:** Script CLI para evaluar lotes de PDFs sin tocar Supabase ni Telegram. Incorpora renderizado dinámico de PDF a imagen JPEG mediante `pdfjs-dist` y `sharp`, extracción multimodal con IA y exportación a CSV con codificación UTF-8 con BOM.
* **Archivo Modificado:** `sirep-back/src/ia-extractor/normalizacion.ts`
  * **Qué hace:** Incorporación de algoritmos de normalización de cadenas, limpieza de tildes/mayúsculas, formatos estrictos de fechas (`AAAA-MM-DD`), horas (`HH:MM`) y cálculo de similitud de texto libre mediante el coeficiente de Sørensen-Dice.
* **Archivo Creado:** `sirep-back/src/ia-extractor/normalizacion.spec.ts`
  * **Qué hace:** 16 pruebas unitarias automatizadas que validan exhaustivamente los casos de coincidencia, textos dudosos y campos vacíos.

### 2. Backend 2 — Kevin (`SIREP-S2-T09` y `SIREP-S2-T08`)
* **Archivos Modificados:**
  * `sirep-back/Caddyfile`: Eliminado el namespace `/gastos` y sustituido por `/reportes`.
  * `sirep-back/docker-compose.yml`: Eliminados contenedores con nombre `siregg-backend`/`siregg-caddy` y aislados bajo `sirep`.
  * `sirep-back/src/common/cors.util.ts` y `src/main.ts`: Eliminadas referencias a `Hallazgo 37.4-E` y `gastos.gateway.ts`.
  * `sirep-back/src/escaneos/escaneos.util.ts` y `.env.example`: Eliminadas referencias al proyecto anterior.
* **Archivo Eliminado:**
  * `sirep-back/supabase/actualizar_base_sirep_prueba.sql`: Eliminado script transitorio; la base ahora se crea 100% limpia vía migraciones reproducibles con `supabase db reset`.
* **Archivos Generados:**
  * `sirep-back/docs/VERIFICACION_T09.md`: Evidencia de 0 coincidencias de `gastos`.
  * `sirep-back/evaluacion_gemini_1600px.csv` y `evaluacion_gemini_2400px.csv`: Resultados de las 25 corridas exitosas.

### 3. Frontend — Flavio (`SIREP-S2-T10` y `SIREP-S2-T11`)
* **Archivo Creado:** `docs/tabla-comparacion-rptech.md`
  * **Qué hace:** Matriz fila por fila de los 28 campos físicos de GO Service comparados contra RP-TECH Especificación v1 con las 4 columnas obligatorias (`Campo del papel`, `Campo de RP-TECH`, `Estado`, `Nota`).
* **Archivo Creado:** `docs/REVISION_CRUZADA_T10.md`
  * **Qué hace:** Auditoría cruzada para la reunión de Miguel con Adrián Miranda.
* **Archivo Modificado:** `sirep-front/app/package.json`
  * **Qué hace:** Normalización del script `dev` (`next dev -p 3001`) eliminando sintaxis de Linux para compatibilidad nativa con Windows.
* **Calibración:** Medición de recortes en `/dev/regiones` con 96.8% de precisión visual.

### 4. Consolidación y Coordinación — Miguel (`SIREP-S2-T05`)
* **Archivo Creado:** `docs/prueba-viabilidad/informe.md`
  * **Qué hace:** Informe final de viabilidad con análisis de costos por reporte ($0.0011 USD), tiempos de procesamiento y proyecciones presupuestarias para 500 y 10,000 reportes.
* **Archivos Creados:**
  * `sirep-back/docs/RESUMEN_DIA_2.md` y `sirep-front/RESUMEN_DIA_2.md`: Bitácora oficial del Día 2 con estado 100% completado.

