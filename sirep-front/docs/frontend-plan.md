# Plan de frontend — bandeja de revisión SIREP

Documento de dirección. Existe para que las decisiones visuales y de arquitectura se puedan revisar
sin leer el código, y para que la integración a RP-TECH no obligue a reinterpretar la maqueta.

## 1. Dirección visual

**Concepto: la mesa de revisión de un archivo técnico.** No es un dashboard: es una superficie de
trabajo que se usa durante horas. Por eso el contraste es contenido, las superficies son cálidas y
cada color semántico tiene ícono y texto además del tono.

Tres decisiones que definen el carácter:

1. **Papel, no blanco.** El fondo es un papel cálido con una textura apenas perceptible. Las filas de
   la tabla son renglones de un registro, no tarjetas flotantes: separadores de 1 px, sin sombras
   genéricas.
2. **El escaneo vive en una mesa oscura.** El visor de la vista de corrección usa un fondo
   azul-petróleo profundo (como un negatoscopio) para que la hoja escaneada sea la única fuente de luz
   del panel. Ese contraste separa "documento" de "formulario", que es la distinción central del
   producto.
3. **La incertidumbre se ve.** Confianza alta / media / baja / no leído se comunica con ícono,
   etiqueta y color; nunca solo con color. Los campos pendientes tienen un filo ámbar, los resueltos
   un filo verde y los ilegibles un tratamiento de rayado.

### Paleta (tokens en `src/styles/tokens.css`)

| Token | Luz | Uso |
| --- | --- | --- |
| `--paper` | `#F5F1E6` | fondo de la aplicación |
| `--paper-raised` | `#FBF8F0` | paneles, cabecera de tabla |
| `--paper-sunken` | `#EAE3D3` | inputs, pestañas inactivas, mesa del escaneo en móvil |
| `--line` | `#D6CDB9` | separadores y bordes de 1 px |
| `--line-strong` | `#B9AD95` | bordes de controles |
| `--ink` | `#17282C` | texto principal (contraste ≈ 13:1) |
| `--ink-muted` | `#4A5A5C` | texto secundario (≈ 6.6:1) |
| `--ink-faint` | `#5C6B6B` | metadatos (≈ 5.1:1) |
| `--petrol-600` | `#13545F` | primario, foco, tinta del escaneo |
| `--petrol-700` | `#0C4049` | hover del primario |
| `--petrol-900` | `#072A31` | mesa del visor |
| `--amber-600` | `#9A640B` | confianza media / pendiente |
| `--brick-600` | `#A23E2C` | confianza baja / ilegible |
| `--green-600` | `#2F6A4E` | confirmado / completo |

Superficies de apoyo: `--petrol-50`, `--amber-50`, `--brick-50`, `--green-50` como fondos de
etiquetas. Tokens oscuros completos bajo `[data-theme="dark"]`, sin interruptor visible todavía.

### Tipografía

| Rol | Familia | Uso |
| --- | --- | --- |
| Interfaz | **Archivo** (`next/font/google`) | títulos, etiquetas, texto de interfaz |
| Datos | **IBM Plex Mono** | N° de reporte, serie, fechas, códigos, contadores |
| Escaneo falso | **Caveat** | única y exclusivamente la letra manuscrita del SVG simulado |

Escala: `micro` 11 px (mayúsculas, tracking .08em), `meta` 12.5 px, `body` 14 px, `title` 20 px,
`display` clamp(26–34 px). Números tabulares en mono. La tipografía no se usa como decoración: el
mono marca todo lo que una persona va a copiar o comparar.

### Espaciado, radios y elevación

- Base de 4 px (`--spacing`) y dos alias semánticos: `--space-panel` (20 px) y `--space-gutter`
  (24–48 px según ancho).
- Radios: 3 px (controles densos), 6 px (paneles y tarjetas), 10 px (hoja escaneada). Nada de
  píldoras salvo contadores.
- Sombras: solo dos, `--shadow-sheet` (hoja sobre la mesa) y `--shadow-lift` (elemento activo).
  Prohibidas las sombras difusas en tarjetas de contenido.
- Textura de papel: retícula de puntos a 24 px con opacidad mínima sobre el fondo.

## 2. Arquitectura

```
src/
├── app/
│   ├── layout.tsx                     # fuentes, tokens, cabecera y pie globales
│   ├── page.tsx                       # bandeja (contenedor cliente)
│   ├── reportes/[numero]/page.tsx     # vista de corrección (resuelve params)
│   └── dev/regiones/page.tsx          # calibración, solo desarrollo
├── components/
│   ├── ui/                            # shadcn/ui vendorizado a mano
│   │   ├── boton.tsx  entrada.tsx  insignia.tsx  esqueleto.tsx
│   └── layout/
│       ├── cabecera-app.tsx  pie-app.tsx
├── features/revision/
│   ├── components/
│   │   ├── bandeja/                   # resumen, herramientas, tabla, tarjetas, estados
│   │   ├── correccion/                # visor, panel, tarjetas de campo, progreso, cierre
│   │   ├── escaneo/                   # recorte, hoja falsa, resaltado
│   │   └── calibracion/               # mapa y lista de cobertura
│   ├── hooks/                         # use-bandeja, use-revision-reporte, use-atajos
│   ├── services/                      # contrato + implementación simulada
│   ├── types/                         # dominio, campos y regiones
│   └── lib/                           # recorte, orden, filtros, dudosos, formato
├── config/
│   ├── campos-formulario.ts           # inventario provisional (fuente de verdad)
│   ├── escaneo-falso.ts               # dibujo SVG del escaneo inventado
│   ├── entorno.ts                     # guardas de pantallas de desarrollo
│   ├── sesion.ts                      # usuario simulado (TODO auth)
│   └── regiones/                      # un mapa por diseño de talonario
├── mocks/
│   └── reportes.ts                    # 12 reportes simulados
└── styles/
    └── tokens.css                     # colores, tipografía, radios, sombras
```

### Componentes y responsabilidad

**Bandeja**

| Componente | Responsabilidad |
| --- | --- |
| `resumen-bandeja` | Tres cifras: pendientes, campos dudosos, completados. Sin tarjetas. |
| `barra-herramientas` | Búsqueda, filtro de estado, filtro de origen, orden y limpieza. |
| `tabla-reportes` | Tabla densa de escritorio; la fila entera es un enlace accesible. |
| `lista-tarjetas` | La misma información en tarjetas para móvil/tablet. |
| `celda-dudosos` | Cantidad + tira de marcas que muestra la composición de confianza. |
| `etiqueta-estado` / `etiqueta-origen` | Semántica de estado y procedencia, con texto e ícono. |
| `estados-bandeja` | Carga (skeleton), vacío, error y filtro sin resultados, cada uno con copy propio. |

**Corrección**

| Componente | Responsabilidad |
| --- | --- |
| `vista-revision` | Contenedor cliente: carga el reporte, conecta el hook y reparte paneles. |
| `cabecera-reporte` | Identidad del reporte, origen, escaneo y estado. |
| `progreso-revision` | "3 de 5 dudosos resueltos" con barra segmentada y deshacer. |
| `visor-escaneo` | Mesa oscura, página, zoom, hoja y resaltado de la región activa. |
| `hoja-escaneada` | SVG falso; coloca cada valor sobre las mismas regiones del mapa. |
| `resaltado-region` | Rectángulo y etiqueta de la región activa sobre la hoja. |
| `panel-campos` | Agrupa por sección, pendientes primero; filtro dudosos/todos. |
| `tarjeta-campo` | Recorte, valor del modelo, confianza, estado y acciones del campo. |
| `indicador-confianza` | Ícono + etiqueta + tono; nunca solo color. |
| `editor-correccion` | Input inline con guardar/cancelar y Enter/Escape. |
| `cierre-revision` | Cierre del reporte: resumen de disposiciones y salida. |
| `ayuda-teclado` | Atajos visibles y accesibles, sin modal. |
| `flujo-movil` | Un campo por pantalla, recorte arriba, acciones de 44 px abajo. |

**Calibración**

| Componente | Responsabilidad |
| --- | --- |
| `mapa-calibracion` | Dibuja todas las regiones sobre la hoja y sincroniza la selección. |
| `lista-cobertura` | Verifica campo por campo que existe definición y región. |

### Capas

- **Tipos** (`types/`): contrato del dominio, sin dependencias de React.
- **Config** (`config/`): inventario provisional y mapas. Reemplazable sin tocar componentes.
- **Servicios** (`services/`): `RepositorioReportes` es el único acceso a datos. La implementación
  simulada entra por `repositorio-simulado.ts`; una implementación Supabase respeta el mismo
  contrato.
- **Lib** (`lib/`): funciones puras y probadas (recorte, filtros, orden, avance de dudosos).
- **Hooks** (`hooks/`): estado de UI y orquestación; no renderizan.
- **Componentes** (`components/`): solo presentación; reciben datos y callbacks.

### Decisiones de implementación

| Decisión | Detalle | Justificación |
| --- | --- | --- |
| Primitivas de UI vendorizadas | `src/components/ui/{boton,entrada,insignia,esqueleto}.tsx` con el contrato de shadcn/ui (`cva` + `tailwind-merge`), sin `npx shadcn add` | Evita arrastrar `components.json` y `tw-animate-css` a un proyecto con tokens propios; al integrar a RP-TECH se reemplazan por los componentes del sistema sin tocar las pantallas |
| Nombres de archivo en español | `boton.tsx` en lugar de `button.tsx` | Consistente con `lib/`, `types/` y `config/`, que ya usan español |
| Dibujo del escaneo en `config/` | `src/config/escaneo-falso.ts` en lugar de `src/mocks/escaneo-svg.ts` | La regla de oro prohíbe que los componentes importen `mocks/`; el dibujo es configuración compartida y el contenido manuscrito sí llega por props desde el repositorio |
| Escaneo generado desde el mapa | `HojaEscaneada` dibuja etiquetas y valores usando `MAPA_TALONARIO_2005` | Un cambio de talonario no obliga a redibujar el SVG a mano y los recortes coinciden por construcción |

### Decisiones de interacción

- **Tab no se secuestra.** El requisito pedía "Tab o flechas". Tab conserva su comportamiento nativo
  (recorre los controles del campo, que es navegación accesible). El salto explícito entre dudosos
  se hace con `↓`/`↑` (y `j`/`k`), que es el gesto que un técnico repite cientos de veces. Un atajo
  global de Tab rompería el foco visible y el recorrido de lectores de pantalla.
- **Enter confirma** solo cuando el foco no está en un control interactivo; si está en un botón, el
  botón hace su acción. Mientras se corrige, Enter guarda y avanza.
- **Cada acción es reversible.** Toda disposición resuelta muestra "Reabrir"; la última acción se
  puede deshacer desde la barra de progreso.
- **El estado del reporte se deriva.** Al resolver el último dudoso, el reporte pasa a `completo`;
  reabrir un campo lo devuelve a `en_revision`. No hay un botón de "completar" que pueda mentir.
- **Filtrado local en el prototipo.** Con 12 registros es instantáneo. TODO: paginación y filtrado en
  servidor cuando el repositorio real tenga 400–500 reportes.

### Responsive

| Ancho | Bandeja | Corrección |
| --- | --- | --- |
| 360 | tarjetas a una columna, resumen compacto | un campo por pantalla, recorte arriba, acciones fijas de 44 px |
| 768 | tarjetas a dos columnas | un campo por pantalla con recorte amplio |
| 1280 | tabla densa | dos paneles, visor sticky |
| 1920 | tabla y paneles con contenedor máximo 1500 px | visor más amplio, panel de campos legible |

### Accesibilidad

- Contraste AA en texto y controles; foco visible de 2 px con offset sobre papel y sobre la mesa.
- Tabla semántica con `caption` para lectores de pantalla; tarjetas con enlace único y nombre
  accesible explícito.
- `aria-live` para anunciar confirmaciones y avances; `role="progressbar"` con valores.
- Atajos documentados en pantalla y desactivados al escribir en un campo.
- Objetivos táctiles ≥ 44 px en móvil; `prefers-reduced-motion` respetado.

## 3. Datos y estados

- `Confianza`: `alta | media | baja`; un campo puede además estar `no_leido`.
- `EstadoEscaneo`: `recibido | procesado | en_revision | completo`.
- `Origen`: `historico | sistema`.
- `EstadoRevisionCampo`: `pendiente | confirmado | corregido | ilegible`.
- Cada campo guarda `valor_modelo`, `confianza`, `no_leido`, `valor_corregido`, `corregido_por`,
  `corregido_en`, `revisado_por`, `revisado_en` y `estado_revision`.
- Estados de demostración por URL: `?demo=error` y `?demo=vacio` (documentados en el README).

## 4. Pendientes (TODOs)

- Inventario real del formulario: reemplazar `config/campos-formulario.ts` y su mapa.
- Autenticación: `config/sesion.ts` usa un técnico simulado.
- Persistencia: la implementación simulada usa `localStorage`; el repositorio real usará Supabase.
- Paginación y filtrado en servidor para el volumen de producción.
- Modo oscuro: tokens listos; falta el interruptor y la revisión visual.
- Exportación a Excel y vínculo con RP-TECH: fuera del alcance de esta maqueta.
