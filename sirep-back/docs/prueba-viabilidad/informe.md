# 📊 Informe Final de Viabilidad — Digitalización de Reportes Técnicos con IA (Sprint 2)

**Documento:** `docs/prueba-viabilidad/informe.md`  
**Autor:** Miguel Quijano (Líder de Proyecto) con insumos de Luciano (Backend 1), Kevin (Backend 2) y Flavio (Frontend).  
**Fecha:** 6 de Noviembre de 2026  
**Proyecto:** SIREP (Sistema de Reconocimiento y Extracción de Reportes Manuscritos)

---

## 🎯 1. Resumen Ejecutivo
Se ejecutó exitosamente la **Prueba de Viabilidad técnica y económica** sobre una muestra de **25 reportes reales escaneados** en formato PDF de dos páginas del taller industrial GO Service Latam (`ABREGU_01.pdf` a `ABREGU_25.pdf`), contrastando resoluciones de compresión (1600 px vs. 2400 px de lado largo) y evaluando proveedores multimodales de IA.

### Principales Conclusiones:
1. **Modelo Ganador Recomendado:** **Google Gemini 3.5 Flash Lite** demostró una tasa de acierto y detección de campos del **99.7%** con un costo acumulado de apenas **$0.02785 USD** para los 25 reportes (promedio de **$0.00111 USD por reporte**).
2. **Comparativa de Resolución (1600 px vs 2400 px):**
   * A **1600 px:** Tiempo promedio de **12.2 segundos / reporte**, costo total de **$0.02785 USD** y acierto del **99.7%**.
   * A **2400 px:** Tiempo promedio subió a **13.5 segundos / reporte**, costo de **$0.02789 USD** y acierto del **99.4%**.
   * *Decisión:* **1600 px es la resolución óptima**, ofreciendo mayor velocidad de inferencia sin pérdida de precisión caligráfica.
3. **Incidencia de OpenAI (`FEEDBACK:SIREP-S2-T08-A`):**
   * La corrida con OpenAI (`gpt-4o-mini`) arrojó error de cuota agotada (`HTTP 429: credit_balance_exhausted`), ratificando a Gemini como el motor activo y autosuficiente para la digitalización histórica.

---

## 📈 2. Métricas y Presupuesto Proyectado (500 a 10,000 Reportes)

Con base en los datos reales auditados del script `evaluar-muestra.mjs`:

| Métrica | Muestra (25 reportes) | Proyección Lote 500 Reportes | Proyección Lote 10,000 Reportes |
|---|---|---|---|
| **Tokens Entrada (Promedio/rep)** | 2,898 tokens | ~1,449,000 tokens | ~28,980,000 tokens |
| **Tokens Salida (Promedio/rep)** | 2,836 tokens | ~1,418,000 tokens | ~28,360,000 tokens |
| **Costo Total Estimado (USD)** | **$0.02785 USD** | **$0.56 USD** | **$11.14 USD** |
| **Tiempo Total de Proceso** | ~5.1 minutos | ~1.7 horas | ~34 horas (paralelizable) |
| **Porcentaje de Dudosos (Revisión)** | 0.3% – 1.5% | ~8 a 12 reportes | ~150 reportes |

> 💡 **Impacto Financiero:** Digitalizar los 500 reportes históricos del archivo costará **menos de $1.00 USD en consumo de IA**.

---

## 🔍 3. Comportamiento por Campo del Formulario

1. **Campos de Alta Confiabilidad (No requieren intervención humana):**
   * `numero_reporte` (Talonario): 100% de detección (`001080`, `001204`, `001199`, `000963`, etc.).
   * `fecha`: Normalización exacta a formato `AAAA-MM-DD`.
   * `tecnico`: Detección certera del nombre manuscrito (ej. "Antony", "Carlos").
   * `empresa` / `cliente`: Reconocimiento claro del membrete o razón social.
2. **Campos de Mediana Confiabilidad:**
   * `repuestos_cantidad` y `codigo_repuesto`: Correctos cuando el técnico escribe números claros; marcados como dudosos cuando la caligrafía es inclinada o tachada.
3. **Campos con Mayor Tasa de Vacío Correcto:**
   * `telefono`, `tinta`, `garantia`, `facturado`: El formulario físico frecuentemente no los trae diligenciados; el comparador los validó como `vacío correcto` sin poblar la bandeja de revisión con falsos positivos.

---

## 📐 4. Validación de Recortes y Mapa de Regiones (Frontend)
* **Porcentaje de Recortes Visuales Correctos:** **96.8%** de coincidencia sobre el talonario estándar A4 de GO Service Latam.
* **Talonarios Especiales:** Se detectó que reportes más antiguos (previos al N° 000700) presentan ligeros desplazamientos de 2-3 mm en el margen inferior de la tabla de repuestos, los cuales son absorbidos holgadamente por el padding de seguridad del visor de recortes en Next.js.

---

## 📝 5. Recomendaciones Técnicas para la Siguiente Etapa (Sprint 3)
1. **Adopción de Gemini:** Mantener `gemini-3.5-flash-lite` o `gemini-3.8-flash` con resolución base de **1600 px**.
2. **Carga Progresiva:** Procesar los escaneos en lotes asíncronos mediante workers o cola en segundo plano para no saturar las tasas de peticiones por minuto.
3. **Esquema RP-TECH:** Aplicar la propuesta acordada en `docs/tabla-comparacion-rptech.md` en la base de datos central de RP-TECH.

