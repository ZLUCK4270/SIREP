# 📊 Tabla de Comparación: Reporte Físico (GO Service) vs. RP-TECH Especificación v1

**Documento para:** Reunión T04 de Miguel Quijano con Adrián Miranda (Líder RP-TECH).  
**Objetivo:** Acordar el mapeo definitivo entre los campos físicos del formulario manuscrito de GO Service Latam y la tabla `reportes` de RP-TECH, definiendo qué campos existen, cuáles deben agregarse mediante migración y cuáles son opcionales para la carga del histórico.

---

## Resumen Ejecutivo
- **Campos del Papel Analizados:** 28 campos extraídos de la hoja de servicio técnico.
- **Campos con Coincidencia Exacta en RP-TECH:** 7 campos (`cliente`, `fecha`, `serie_equipo`, `procedimiento`, `codigo_repuesto`, `tecnico_asignado`, `estado_reporte`).
- **Campos Faltantes en RP-TECH (A incorporar vía migración en RP-TECH):** 19 campos requeridos para preservar la fidelidad técnica del histórico.
- **Campos Propios de RP-TECH no presentes en el papel (Opcionales para el histórico):** 4 campos (`fotos_ingreso`, `fotos_salida`, `firmas_digitales_pad`, `numero_caso_crm`).

---

## Tabla Comparativa Fila por Fila

| Campo del papel | Campo de RP-TECH | Estado | Nota |
|---|---|---|---|
| **N° de Talonario** (`000845`, impreso) | `numero_talonario` | Falta | Identificador único físico del papel. En RP-TECH los reportes nacen con UUID o correlativo digital; para el histórico es vital indexar por este número. |
| **Técnico** | `tecnico_asignado` | Existe | Mapeo directo con el nombre o ID del técnico de soporte en RP-TECH. |
| **Empresa / Cliente** | `cliente` | Existe | Razón social o nombre comercial de la empresa intervenida. |
| **Fecha de Atención** | `fecha` | Existe | Fecha del servicio (`date`). Normalizado a `AAAA-MM-DD`. |
| **Teléfono** (`TELF`) | `telefono` | Falta | Campo de contacto directo en sitio. Frecuentemente opcional en el papel. Debe agregarse como `text` opcional. |
| **Dirección** | `direccion` | Falta | Ubicación física de la planta o sede intervenida. Propuesto como `text`. |
| **Contacto** | `contacto` | Falta | Nombre de la persona o supervisor en planta que recibió al técnico. Propuesto como `text`. |
| **Equipo** (Marca y Modelo) | `serie_equipo` | Existe | En RP-TECH se consolidan modelo y serie en `serie_equipo` o referencia del activo. |
| **Motivo de la Visita** | `motivo` | Falta | Descripción inicial de la falla o solicitud del cliente (ej. "Mantenimiento preventivo", "Falla de encendido"). Propuesto como `text`. |
| **Estado del Equipo** (Casillas) | `estado_equipo` | Falta | Valores posibles: `Operativo` / `Inoperativo`. En RP-TECH no existía esta clasificación dicotómica de ingreso. |
| **Último Mantenimiento** | `ultimo_mantenimiento` | Falta | Fecha o indicación manuscrita del mantenimiento previo reportado por el cliente. |
| **Limpieza del Equipo** (Casillas) | `limpieza_equipo` | Falta | Valores: `Limpio` / `Sucio`. Diagnóstico visual de higiene industrial. |
| **Cabezales** (Casillas) | `cabezales` | Falta | Valores: `Bueno` / `Regular` / `Malo`. Estado de desgaste físico del componente de impresión/inyección. |
| **Sistema de Protección** | `sistema_proteccion` | Falta | Casillas `Estab.` / `UPS` y anotación de voltaje o modelo de estabilizador. |
| **Tinta** | `tinta` | Falta | Tipo o nivel de insumo/tinta utilizada en el equipo al momento de la intervención. |
| **Revisión Líneas L+N** | `revision_linea_ln` | Falta | Medición de tensión Línea - Neutro (ej. "220V"). |
| **Revisión Líneas L+T** | `revision_linea_lt` | Falta | Medición de tensión Línea - Tierra. |
| **Revisión Líneas N+T** | `revision_linea_nt` | Falta | Medición de tensión Neutro - Tierra (crítica para descarte de inducción eléctrica). |
| **Operador** | `operador` | Falta | Nombre del operario habitual de la máquina en planta. |
| **Procedimiento** | `procedimiento` | Existe | Detalle paso a paso del servicio técnico realizado. Texto extenso. |
| **Conclusión** | `conclusion` | Falta | Diagnóstico y resolución final del problema por parte del técnico. |
| **Recomendaciones** | `recomendaciones` | Falta | Instrucciones preventivas y cuidados indicados al cliente. |
| **Repuestos: Tipo** (Casillas) | `repuestos_tipo` | Falta | Valores: `Venta`, `Descarte` o `Garantía`. Define el tratamiento contable/garantía del repuesto. |
| **Repuestos: Código** | `codigo_repuesto` | Existe | Número de parte o código de inventario del repuesto sustituido. |
| **Repuestos: Descripción** | `repuestos_descripcion` | Falta | Nombre descriptivo del repuesto cuando el técnico no recuerda el código exacto. |
| **Repuestos: Cantidad** | `repuestos_cantidad` | Falta | Unidades utilizadas de cada repuesto. |
| **Hora de Llegada** | `hora_llegada` | Falta | Hora de ingreso a instalaciones del cliente (`HH:MM`). |
| **Hora de Salida** | `hora_salida` | Falta | Hora de término del servicio (`HH:MM`). |
| **Garantía** (Casilla) | `garantia` | Falta | Booleano / texto que indica si la orden se ejecutó bajo cobertura de garantía comercial. |
| **Facturado** (Casilla) | `facturado` | Falta | Indicador si la labor genera factura independiente o entra en abono mensual. |
| **Firma Operador** | `firma_operador` | Falta | Confirmación de presencia de firma física manuscrita en el documento escaneado. |
| **Firma Cliente / Administrador** | `firma_cliente` | Falta | Confirmación de conformidad del cliente mediante firma manuscrita. |
| *(Exclusivo RP-TECH)* | `fotos_ingreso` | Sobra | RP-TECH digital exige fotos tomadas con la app móvil. Para el histórico en papel este campo debe ser `nullable`. |
| *(Exclusivo RP-TECH)* | `fotos_salida` | Sobra | Mismo criterio que fotos de ingreso: opcional para reportes con `origen = 'historico'`. |
| *(Exclusivo RP-TECH)* | `numero_caso_crm` | Sobra | No figura en talonarios antiguos impresos antes del despliegue del CRM. Opcional en migración. |
| *(Exclusivo RP-TECH)* | `firmas_digitales_pad` | Sobra | Sustituido en el histórico por `firma_operador` y `firma_cliente` detectadas en el papel escaneado. |

---

## 📌 Recomendaciones de Implementación para Adrián Miranda
1. **Columna `origen`:** Incorporar `origen text not null default 'sistema' check (origen in ('historico', 'sistema'))` en la tabla `reportes` de RP-TECH.
2. **Campos Opcionales en Histórico:** Configurar como `nullables` todas las validaciones de UI y Backend de RP-TECH sobre fotos y firmas digitales cuando `origen == 'historico'`.
3. **Migración en RP-TECH:** Enviar esta especificación para que RP-TECH emita la migración `add_column_historico_sirep.sql` incorporando las columnas identificadas como "Falta".

