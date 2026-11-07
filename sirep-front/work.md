# Rol y objetivo

Eres un ingeniero frontend senior con criterio de diseño. Vas a terminar el prototipo funcional de la **bandeja de revisión de SIREP**. No hay maqueta de Figma: este prototipo es el diseño. Debe verse como un producto real y cuidado, y estar estructurado como código de producción que luego se integra a RP-TECH sin rehacerlo.

Si tienes disponible una skill de diseño UI/UX (por ejemplo Impeccable), úsala para las decisiones visuales.

---

# Contexto del producto

SIREP digitaliza entre 400 y 500 reportes técnicos escritos a mano del taller GO Service Latam (soporte multimarcas). La secretaria escanea cada reporte en la impresora multifuncional y lo envía por Telegram. Un modelo de IA multimodal lee el escaneo, devuelve cada campo con su nivel de confianza (alta, media o baja) o con la marca `no_leido`, y solo pregunta por lo dudoso. Lo que sigue sin resolver aparece en la **bandeja de revisión**, donde un técnico ve el recorte de la imagen del escaneo justo al lado del campo dudoso y lo corrige.

**Por qué importa el diseño:** con letra manuscrita siempre habrá campos dudosos. La interfaz debe hacer que revisar solo esos sea rápido, obvio y sin fricciones. Si el técnico tiene que revisar todo, el sistema no ahorra trabajo.

## Caso de ejemplo (para los datos simulados)

> 1. La secretaria escanea el reporte N° 000845 a 300 dpi y envía el PDF por Telegram.
> 2. El bot verifica que el N° 000845 no esté registrado, guarda el escaneo y lo envía al modelo.
> 3. El modelo devuelve: cliente, fecha y número de serie con confianza **alta**; procedimiento con confianza **media**; el código de un repuesto con confianza **baja**.
> 4. El bot pregunta solo por el código del repuesto. La secretaria responde "no se lee".
> 5. El campo queda marcado como `no_leido`. Aparece en la bandeja con el recorte de la imagen al lado.
> 6. Un técnico ve la bandeja, reconoce el código en el recorte y lo corrige. El registro queda completo.

---

# Estado actual del repositorio

La carpeta `app/` ya tiene Next.js inicializado con la arquitectura, los tokens y la capa de datos lista. **No rehaces lo que ya existe; lo usas como base y lo completás.**

## Lo que ya existe y funciona

| Artefacto | Ruta | Qué tiene |
|---|---|---|
| Tokens de diseño | `src/styles/tokens.css` | Paleta completa (paper, petróleo, ámbar, ladrillo, verde, mesa oscura), tipografía, radios, sombras y modo oscuro preparado |
| CSS global | `src/app/globals.css` | Conecta tokens con Tailwind v4 (`@theme inline`), estilos base (retícula de papel, foco, scroll fino, skip link) |
| Tipos del dominio | `src/features/revision/types/dominio.ts` | `Reporte`, `CampoReporte`, `Escaneo`, `CampoVista`, `ReporteVista`, `RepositorioReportes`, estados, confianza, acciones de revisión |
| Tipos de campos | `src/features/revision/types/campos.ts` | `IdCampo`, `IdSeccion`, `DefinicionCampo`, `TipoCampo` |
| Tipos de regiones | `src/features/revision/types/regiones.ts` | `Region`, `MapaRegiones` |
| Inventario de campos | `src/config/campos-formulario.ts` | 20 campos con etiquetas, secciones y tipo; accesos indexados (`CAMPOS_POR_ID`, `ORDEN_CAMPOS`, `CAMPOS_POR_SECCION`) |
| Mapa de regiones | `src/config/regiones/talonario-2005-a4.ts` | Coordenadas normalizadas (0–1) de todos los campos sobre el talonario A4 de dos páginas |
| Datos simulados | `src/mocks/reportes.ts` | 10–12 reportes con estados, orígenes y campos dudosos variados; incluye el caso N° 000845 |
| Filtros | `src/features/revision/lib/filtros.ts` | `filtrarReportes`, `coincideNumeroReporte` (tolerante a ceros y separadores) |
| Orden | `src/features/revision/lib/orden.ts` | `ordenarReportes` (dudosos, recientes, número) |
| Dudosos | `src/features/revision/lib/dudosos.ts` | `esDudoso`, `calcularPendientes`, `agruparCampos`, `siguienteCampoPendiente` |
| Recorte | `src/features/revision/lib/recorte.ts` | `calcularRecorte`: posición CSS para mostrar el recorte del escaneo sin canvas ni librerías |
| Etiquetas | `src/features/revision/lib/etiquetas.ts` | Vocabulario visible de estados, confianza, origen y revisión |
| Formato | `src/features/revision/lib/formato.ts` | Fechas, números de reporte, horas, plurales, iniciales |
| Tests | `src/features/revision/lib/*.test.ts` | Pruebas de `calcularRecorte` y de la lógica de bandeja |

## Lo que falta y debes construir

1. **`src/app/layout.tsx`** — Reemplazar el layout por defecto (hoy usa Geist; el diseño pide Archivo + IBM Plex Mono), conectar fonts con `next/font/google`, aplicar `lang="es"`, el skip link y los metadatos correctos.
2. **`src/app/page.tsx`** — La bandeja (hoy es la plantilla por defecto de Next.js; debe ser la vista real).
3. **`src/app/reportes/[numero]/page.tsx`** — Vista de corrección de un reporte.
4. **`src/app/dev/regiones/page.tsx`** — Página de calibración del mapa (solo desarrollo).
5. **`src/features/revision/components/`** — Todos los componentes de presentación.
6. **`src/features/revision/hooks/`** — Hooks que encapsulan estado y lógica de UI.
7. **`src/features/revision/services/`** — Implementación simulada de `RepositorioReportes` (contrato ya en `types/dominio.ts`) que lee de `mocks/reportes.ts`.
8. **`src/mocks/escaneo-svg.ts`** o **`public/escaneo-falso.svg`** — El SVG falso del escaneo (ver sección "Datos simulados").
9. **`src/components/ui/`** — Componentes de shadcn/ui que uses (agregar uno a uno con `npx shadcn@latest add`).
10. **`docs/frontend-plan.md`** — El plan de trabajo antes de programar (ver sección "Proceso").

---

# El formulario físico (inventario real)

El talonario es de **GO Service Latam**, hoja A4 de dos páginas. Este es el inventario confirmado sobre las primeras muestras. El inventario provisional en `campos-formulario.ts` tiene 20 campos; el inventario real tiene más. Actualizá ese archivo si agregás campos, manteniendo la compatibilidad con `talonario-2005-a4.ts`.

| Zona | Campo | Tipo | Notas relevantes para el diseño |
|---|---|---|---|
| Cabecera | N° del reporte (sello rojo) | código | Siempre impreso. Hay formatos `000214` y `0005-A`: nunca tratar como número entero |
| Cabecera | Técnico | texto | Puede traer dos nombres ("Angelo / Fabian") |
| Datos | Empresa / Cliente | texto | Lleno en todas las muestras |
| Datos | Fecha | fecha | Formato `día/mes/año` con año de 2 dígitos; algunos trazos ambiguos |
| Datos | Teléfono | texto | Frecuentemente vacío |
| Datos | Dirección | texto | Casi siempre lleno |
| Datos | Equipo | texto | Casi siempre lleno |
| Datos | Contacto | texto | Frecuentemente vacío |
| Datos | Motivo / Falla reportada | multilinea | Lleno en todas |
| Revisión inicial | Estado del equipo | casilla (Operativo / Inoperativo) | Lleno en pocas muestras |
| Revisión inicial | Limpieza del equipo | casilla (Limpio / Sucio) | Lleno en pocas |
| Revisión inicial | Cabezales | casilla (Bueno / Regular / Malo) | Lleno en pocas |
| Cuerpo | Procedimiento | multilinea | El más difícil: varias líneas, tachaduras, mayúsculas |
| Cuerpo | Conclusión | multilinea | A veces vacío |
| Cuerpo | Recomendaciones | multilinea | A veces vacío |
| Repuestos | Tabla: código, descripción, cantidad | tabla (filas múltiples) | Solo 2 de 10 muestras la tienen llena |
| Labor | Hora de llegada | hora | Formatos ambiguos ("3 p", "16:51") |
| Labor | Hora de salida | hora | Idem |
| Pie | Firma del cliente | firma | Presente en la mayoría |
| Pie | Sello | sello | No siempre presente |

**Qué hace difícil la lectura (insumo para el diseño de la vista de corrección):**
- Letra manuscrita mezclada con cursiva, mayúsculas y tachaduras.
- Páginas torcidas, bordes cortados, sombras y marca de agua diagonal ("Technical Training Center").
- Casillas marcadas con X, visto, círculo o garabato, a veces fuera del cuadro.
- Horas sin indicar a.m./p.m.; fechas con año de dos dígitos.

---

# Alcance: qué construyes

## 1. Layout y cabecera de la app

- Fuentes con `next/font/google`: **Archivo** para la interfaz (`--font-archivo`), **IBM Plex Mono** para números y códigos (`--font-plex-mono`). Ambas ya referenciadas en `tokens.css`.
- Cabecera con: logo/nombre "SIREP", indicador del usuario activo (dato fijo en el prototipo), y acceso a la bandeja.
- Skip link (`salto-contenido`) ya definido en `globals.css`.

## 2. Bandeja (lista de reportes)

- Resumen superior: reportes pendientes, campos dudosos totales, completados hoy.
- Búsqueda por N° de reporte (usa `coincideNumeroReporte` de `lib/filtros.ts`).
- Filtros: estado (recibido, procesado, en_revision, completo, todos) y origen (histórico, sistema, todos).
- Orden seleccionable: más dudosos primero (por defecto), actualizados, N° de reporte. Usa `ordenarReportes`.
- **Escritorio:** tabla densa y escaneable. **Móvil:** tarjetas apiladas.
- Estados: cargando (skeleton), vacío, error, filtro sin resultados.
- Cada fila muestra: N° de reporte (mono), cliente, equipo, técnico, estado (badge con tono semántico), origen, cantidad de dudosos pendientes (prominente), fecha. Al hacer clic navega a `/reportes/[numero]`.

## 3. Vista de corrección (el corazón del diseño)

### Escritorio: dos paneles fijos

**Panel izquierdo — visor del escaneo:**
- Muestra el escaneo completo (anverso o reverso según el campo activo) sobre fondo oscuro tipo mesa (`--stage`).
- Resalta la región del campo activo con un recuadro de color.
- Controles: zoom (+/−), pasar entre páginas (anverso/reverso).
- El recorte del campo activo se muestra prominentemente encima del visor usando `calcularRecorte` de `lib/recorte.ts`. Sin canvas ni librerías externas.

**Panel derecho — lista de campos:**
- Campos agrupados por sección (usa `agruparCampos`). Dudosos primero, tanto entre secciones como dentro de cada una.
- Toggle "solo dudosos / todos los campos".
- Barra de progreso: "N de M dudosos resueltos".
- Cada campo muestra: recorte de imagen (miniatura), valor leído por el modelo, indicador de confianza (ícono + etiqueta + tono de color; nunca solo color), estado de revisión y las acciones disponibles.

### Acciones por campo

| Acción | Cuándo está disponible | Descripción |
|---|---|---|
| Confirmar | Campo pendiente con valor | Acepta el valor del modelo |
| Corregir | Campo pendiente | Abre un input con el valor del modelo precargado; Enter guarda |
| Marcar ilegible | Campo pendiente | Marca el campo como ilegible |
| Reabrir | Campo ya resuelto | Vuelve el campo a pendiente |

### Diferenciación visual obligatoria

El técnico debe distinguir de un vistazo:
- Qué leyó el modelo (valor con nivel de confianza).
- Qué corrigió una persona (valor corregido, con quién y cuándo; en tono `green`).
- Qué sigue pendiente (en tono `amber` o `brick` según confianza).
- Qué se marcó como ilegible (en tono `brick`).

### Navegación por teclado

- `Tab` / `Shift+Tab`: avanza y retrocede entre campos dudosos pendientes (usa `siguienteCampoPendiente`).
- `Enter`: confirma el campo activo (si está pendiente) o guarda la corrección (si el input está enfocado).
- Flecha ↑ / ↓: mueve entre opciones del campo activo.
- El campo activo en la lista hace scroll hacia el recorte correspondiente en el visor.

### Móvil

Un campo a la vez: recorte grande arriba, controles abajo. Botones de avance al campo anterior/siguiente. La barra de progreso siempre visible.

### Estado de reporte completo

Cuando se resuelven todos los campos dudosos, mostrar un cierre claro (animación sutil, resumen de lo hecho, acción para volver a la bandeja).

## 4. SVG del escaneo falso

- NO usar escaneos reales (contienen datos de clientes).
- Generar un SVG que simule el formulario GO Service Latam: fondo de papel, líneas de renglón, texto impreso en las etiquetas, contenido manuscrito simulado (con la fuente `Caveat`, ya en los tokens como `--font-hand`), y marca de agua diagonal "Technical Training Center".
- Las zonas de cada campo deben estar ubicadas en las mismas coordenadas del `MAPA_TALONARIO_2005` para que los recortes coincidan con la región real.
- El SVG puede ser un archivo estático en `public/` o generarse como componente React. Dos "páginas" (anverso y reverso).

## 5. Repositorio de datos simulado

- Implementar `RepositorioReportes` (contrato en `types/dominio.ts`) con los datos de `mocks/reportes.ts`.
- La implementación lee y escribe en memoria (sin `localStorage`): los cambios de revisión se reflejan en la UI pero se pierden al recargar.
- Exponer el repositorio mediante contexto React o inyección por props. Los componentes nunca importan `mocks/reportes.ts` directamente.

## 6. Página de calibración (`/dev/regiones`)

- Dibuja todas las regiones del `MAPA_TALONARIO_2005` sobre el SVG falso, con el nombre del campo encima.
- Permite activar y desactivar regiones individualmente.
- Solo para desarrollo: si se desea, protegerla con una variable de entorno (`NEXT_PUBLIC_DEV_MODE`).

---

# Datos simulados

Los reportes ya están en `src/mocks/reportes.ts`. Verificá que incluyen:
- 8 a 12 reportes con estados y cantidades de dudosos variados.
- El caso N° 000845 (cliente, fecha, serie = alta; procedimiento = media; código de repuesto = no_leido).
- Un campo con valor corregido por una persona (con nombre y fecha).
- Al menos un reporte completo.
- Al menos un reporte recibido (modelo aún no leyó).
- Campos de tipo casilla, hora y firma para cubrir los casos de presentación especiales.

Si alguno de esos casos falta en `reportes.ts`, agregarlo.

---

# Dirección de diseño

**Concepto:** "mesa de revisión de un archivo técnico". Herramienta de trabajo concentrado, sobria, eficiente y con carácter. Se usa durante horas, así que debe cansar poco la vista.

## Tokens (ya definidos en `tokens.css`, no los cambies sin justificación)

| Token semántico | Uso |
|---|---|
| `--paper` (`#f5f1e6`) | Fondo principal, tipo papel envejecido |
| `--paper-raised` | Tarjetas y superficies elevadas |
| `--petrol-600` (`#13545f`) | Primario, interactivo, foco |
| `--amber-600` | Confianza media, campo pendiente |
| `--brick-600` | Confianza baja, ilegible, error |
| `--green-600` | Confirmado, completo |
| `--stage` (`#0d2529`) | Mesa oscura del visor del escaneo |
| `--ink` (`#17282c`) | Texto principal |
| `--ink-muted` | Texto secundario |

## Tipografía

- **Archivo** (UI): peso 400 y 600. Variable: `--font-ui` / clase Tailwind `font-sans`.
- **IBM Plex Mono** (números, series, códigos): Variable: `--font-mono` / clase Tailwind `font-mono`.
- **Caveat** (texto manuscrito simulado en el SVG): Variable: `--font-hand` / clase Tailwind `font-hand`.

## Principios visuales

- La confianza se comunica con **ícono + etiqueta de texto + tono de color**. Nunca solo con color.
- Evitar: gradientes morados, tarjetas idénticas con sombras genéricas, shadcn sin personalizar, emojis, íconos decorativos sin función.
- Responsive de 360 px a pantallas grandes; pensado primero para PC. Probar en 360, 768, 1280 y 1920.
- Accesibilidad: contraste AA, foco visible (ya definido en `globals.css`), navegación por teclado completa, roles/aria correctos, targets táctiles ≥ 44 px en móvil.
- Microanimaciones sutiles (transiciones de 150–250 ms con `--ease-salida`). `prefers-reduced-motion` ya manejado en `globals.css`.

---

# Stack

Next.js (App Router, v15), TypeScript en modo estricto, Tailwind CSS v4 (`@import "tailwindcss"` en `globals.css`), shadcn/ui (agregar solo los componentes que uses con `npx shadcn@latest add`), lucide-react para íconos. No agregar dependencias pesadas sin justificarlo.

---

# Arquitectura (respetar lo que ya existe)

```
src/
├── app/
│   ├── layout.tsx                  # ← CONSTRUIR: fuentes, metadata, skip link
│   ├── page.tsx                    # ← CONSTRUIR: bandeja
│   ├── globals.css                 # ya existe
│   ├── reportes/[numero]/page.tsx  # ← CONSTRUIR: vista de corrección
│   └── dev/regiones/page.tsx       # ← CONSTRUIR: calibración
├── components/ui/                  # ← CONSTRUIR: componentes shadcn
├── features/revision/
│   ├── components/                 # ← CONSTRUIR: presentación pura
│   ├── hooks/                      # ← CONSTRUIR: estado y lógica UI
│   ├── services/                   # ← CONSTRUIR: repositorio simulado
│   ├── types/                      # ya existe (dominio, campos, regiones)
│   └── lib/                        # ya existe (filtros, orden, dudosos, recorte, etiquetas, formato)
├── config/
│   ├── campos-formulario.ts        # ya existe
│   ├── sesion.ts                   # ya existe (usuario activo del prototipo)
│   └── regiones/                   # ya existe (talonario-2005-a4.ts, index.ts)
├── styles/tokens.css               # ya existe
└── mocks/
    ├── reportes.ts                 # ya existe
    └── escaneo-svg.ts (o public/)  # ← CONSTRUIR: SVG falso
```

**Regla de oro:** cada archivo tiene UNA responsabilidad. Componentes de presentación separados de los hooks y de los datos. Los componentes nunca importan `mocks/` directamente.

## Tipos del dominio: qué guardar por campo

`CampoReporte` (ya en `types/dominio.ts`):
- `valor_modelo`: lo que leyó la IA.
- `confianza`: alta / media / baja / null.
- `no_leido`: true si ni el modelo ni la secretaria pudieron leerlo.
- `valor_corregido`: lo que escribió un técnico.
- `estado_revision`: auto | pendiente | confirmado | corregido | ilegible.
- `corregido_por` / `corregido_en`: auditoría de quién lo cambió.

Nombres de dominio en español y snake_case en datos. Código y componentes con nombres claros.

---

# Comentarios

Cada archivo empieza con un comentario en español que explica **qué responsabilidad tiene y por qué existe**. Dentro del código, comentá el **por qué** de las decisiones no obvias (no el qué hace cada línea). La estructura de comentarios de los archivos ya existentes es el modelo a seguir.

---

# Reglas de trabajo

- Rama: `feature/bandeja-revision`. Commits con prefijo `feat`, `fix`, `chore` o `docs`.
- Sin claves ni secretos en el código. Si algo depende de un dato pendiente, dejá un `TODO` con la referencia y seguí.
- Casos difíciles con prueba: la función de recorte (ya probada) y la lógica de avance entre campos ya tienen tests. Si modificás esas funciones, actualizá los tests.
- Actualizá el README con una sección "Frontend": cómo levantarlo, estructura y cómo reemplazar los datos simulados por los reales.

---

# Proceso

1. **Antes de programar**, escribí en `docs/frontend-plan.md`:
   - Árbol de carpetas final con todos los archivos a crear.
   - Lista de componentes con su responsabilidad.
   - Cualquier decisión de diseño que difiera del token o del alcance definido aquí, con su justificación.
   - Luego continuá sin esperar aprobación.

2. **Orden de construcción:**
   - `layout.tsx` + fuentes + metadata.
   - Repositorio simulado (`services/`) + contexto React.
   - Bandeja (`page.tsx`) + componentes de tabla/tarjetas.
   - SVG del escaneo falso.
   - Vista de corrección (`reportes/[numero]/page.tsx`) + recorte + navegación por teclado.
   - Estados vacíos, error y skeleton.
   - Página de calibración (`dev/regiones`).

3. **Al terminar**, verificá que:
   - Compila sin errores de TypeScript (`tsc --noEmit`) ni de lint.
   - El responsive funciona en 360, 768, 1280 y 1920.
   - La navegación por teclado en la vista de corrección es completa.
   - Los tests existentes siguen en verde.

---

# Entrega

Un resumen breve con:
- Lo construido y las decisiones de diseño relevantes.
- Qué queda como TODO.
- Cómo reemplazar los datos simulados por el repositorio real de Supabase.
- Una auditoría de lo realizado en auditoriaFN.md 