# Bandeja de revisión SIREP — prototipo funcional

Rama: `feature/bandeja-revision` · Entrega: PR a `main` · Runner: `vitest` (`npm test`) + `tsc` + `eslint` + `next build`
Estrategia de entrega: `single-pr` (el alcance es una sola feature de prototipo).

## Specs

- **S1** — Construir el prototipo funcional de la bandeja de revisión de SIREP, solo frontend, con datos simulados: "Sin backend, sin Supabase, sin llamadas de red reales."
- **S2** — Bandeja: "Resumen superior: reportes pendientes, campos dudosos totales, completados." Búsqueda por N° de reporte, filtros por estado (`recibido`, `procesado`, `en_revision`, `completo`) y por origen (`historico`, `sistema`). "Orden por defecto: más campos dudosos primero." Escritorio tabla densa, móvil tarjetas, con estados de carga, vacío, error y filtro sin resultados.
- **S3** — Vista de corrección en escritorio: "dos paneles. Un panel muestra el escaneo (anverso/reverso, zoom, con la región del campo activo resaltada). El otro lista los campos agrupados por sección, con los dudosos primero."
- **S4** — Cada campo muestra "recorte de la imagen, valor leído por el modelo, indicador de confianza, y acciones: confirmar, corregir (input) y marcar 'ilegible'."
- **S5** — "Navegación rápida entre campos dudosos con teclado: Enter confirma, Tab o flechas avanzan al siguiente dudoso." (Implementado con flechas/`j`/`k`; Tab se deja nativo por accesibilidad, ver plan.)
- **S6** — "Se distingue visualmente qué leyó el modelo, qué corrigió una persona y qué sigue pendiente." Barra de progreso: "3 de 5 dudosos resueltos". Estado de reporte completo con cierre claro.
- **S7** — Móvil: "un campo a la vez (recorte arriba, controles abajo), con avance al siguiente."
- **S8** — Mapa de regiones: "un archivo de configuración tipado con la zona de cada campo sobre la plantilla del talonario, en coordenadas normalizadas (0 a 1: x, y, ancho, alto, página). Debe soportar varios diseños de talonario (un mapa por diseño)."
- **S9** — Componente que "dado un escaneo y una región, muestra el recorte (con CSS o canvas, sin librerías pesadas)." Página `/dev/regiones` que "dibuja todas las regiones sobre el escaneo".
- **S10** — "8 a 12 reportes con estados, orígenes y cantidades de dudosos variados, incluido el caso 000845." Un campo "no leído", uno corregido por una persona (con quién y cuándo), y reportes completos.
- **S11** — Campos de ejemplo provisionales en UN archivo de configuración fácil de reemplazar. "NO uses escaneos reales"; generar un escaneo falso en SVG "cuyos campos estén ubicados en las mismas coordenadas del mapa de regiones".
- **S12** — Los datos entran por una interfaz de repositorio intercambiable por una implementación Supabase sin tocar los componentes.
- **S13** — Dirección visual: superficies cálidas tipo papel, tinta azul-petróleo, ámbar para dudoso/media, rojo ladrillo para baja/ilegible, verde sobrio para confirmado. Sans con personalidad + mono para números; "Evita Inter o Roboto". Confianza nunca solo con color. Todos los tokens centralizados y listos para modo oscuro.
- **S14** — Arquitectura por responsabilidad única, tipos de dominio en español y `snake_case` en los datos, comentarios en español que expliquen el porqué.
- **S15** — Trabajar en `feature/bandeja-revision`, commits `feat|fix|chore|docs`; pruebas para "la función de cálculo de recorte, el orden/filtrado de la bandeja y la lógica de avance entre campos dudosos"; sección "Frontend" en el README.
- **S16** — Antes de programar, `docs/frontend-plan.md` con dirección visual, árbol de carpetas y componentes. Al terminar, compilar sin errores de TypeScript ni lint y revisar 360/768/1280/1920.

## Tasks

- [x] **T1** — Documento de plan visual y arquitectura. `docs/frontend-plan.md`. Inline. Commit `docs(plan)`.
- [x] **T2** — Fuentes, layout global y primitivas de UI. **Ruta: inline** (es el núcleo visual del que dependen las dos unidades paralelas). Commit `feat(layout)`. Evidencia: `tsc` y `eslint` limpios.
- [x] **T3** — Tipos, inventario de campos y mapas de regiones. Inline. Commit `feat(dominio)`. Evidencia: `tsc --noEmit` sin errores tras corregir el cast de `CAMPOS_POR_SECCION`.
- [x] **T4** — Utilidades puras probadas: recorte, filtros/orden, dudosos. Inline + `vitest`. Commit `feat(utilidades)`. Evidencia: 17 pruebas en verde.
- [x] **T5** — Datos simulados, repositorio, contexto React y escaneo SVG falso. **Ruta: inline** (contrato compartido por las dos unidades paralelas). Commit `feat(datos)`. Evidencia: 42 pruebas en verde, incluida la nueva suite del repositorio y de los mocks.
- [ ] **T6** — Bandeja con resumen, herramientas, tabla/tarjetas y estados. **Ruta: delegada a un writer** (unidad pesada y de superficie disjoint). Commit `feat(bandeja)`.
- [x] **T7** — Página `/dev/regiones` y cobertura del mapa. **Ruta: inline** (depende del SVG compartido). Commit `feat(calibracion)`. Evidencia: `tsc`, `eslint` y 42 pruebas en verde.
- [ ] **T8** — Visor de escaneo, vista de corrección, teclado, progreso, móvil y cierre. **Ruta: delegada a un writer** (unidad pesada y de superficie disjoint respecto de T6). Commit `feat(correccion)`.
- [ ] **T9** — README "Frontend", verificación `tsc`/`eslint`/`vitest`/`build` y revisión responsive. **Ruta: inline**. Commit `docs(readme)`.

### Superficies de edición por unidad (contrato de delegación)

- **Padre (T2, T5, T7, T9):** `src/app/layout.tsx`, `src/app/dev/regiones/**`, `src/components/layout/**`, `src/components/ui/**`, `src/features/revision/services/**`, `src/features/revision/providers/**`, `src/features/revision/components/comunes/**`, `src/features/revision/components/escaneo/{hoja-escaneada,recorte}.tsx`, `src/mocks/**`, `README.md`, `docs/**`, `odd/**`, `package.json`.
- **Writer bandeja (T6):** `src/app/page.tsx`, `src/features/revision/components/bandeja/**`, `src/features/revision/hooks/use-bandeja.ts`.
- **Writer corrección (T8):** `src/app/reportes/[numero]/**`, `src/features/revision/components/correccion/**`, `src/features/revision/components/escaneo/{visor-escaneo,resaltado-region}.tsx`, `src/features/revision/hooks/use-revision-reporte.ts`, `src/features/revision/hooks/use-atajos-teclado.ts`.
- Ninguna unidad edita archivos fuera de su superficie; si necesita un cambio compartido, lo reporta al padre.

## Log

- **L1 (2026-11-02)** — Pedido del usuario, textual en lo esencial: "Vas a construir el prototipo funcional de la bandeja de revisión de SIREP... Debe verse como un producto real y cuidado, no como una plantilla genérica, y estar estructurado como código de producción que luego se integra a RP-TECH sin rehacerlo." Alcance: bandeja con resumen, búsqueda, filtros, orden por dudosos; vista de corrección con escaneo y recorte por campo; mapa de regiones con calibración; datos simulados incluido el caso 000845; tokens y accesibilidad; rama `feature/bandeja-revision`.
- **L2 (2026-11-02)** — Contexto del repositorio: no existía proyecto Next; solo `SIREP-Work.md`. Se creó `main` con el documento y se ramificó la feature. Next 16.4 con `cacheComponents` ya activado por el scaffold.
- **L3 (2026-11-02)** — Decisión: Tab conserva su comportamiento nativo y el salto entre dudosos usa flechas/`j`/`k`. Motivo: un atajo global de Tab rompe foco visible y navegación asistiva; el requisito admite "Tab o flechas".
- **L4 (2026-11-02)** — Decisión: el estado del reporte se deriva de los campos (último dudoso resuelto ⇒ `completo`), con reapertura explícita. Evita un botón de completar que pueda contradecir la evidencia.
- **L5 (2026-11-02)** — Reanudación: `docs/frontend-plan.md`, tipos, configuración, lib con17 pruebas y mocks ya existían sin commitear. Línea base observada: `tsc --noEmit` con un error en `CAMPOS_POR_SECCION` (cast insuficiente) → corregido con doble cast documentado; `vitest run` con17/17 en verde. Se restauró la raíz `.gitignore` (había sido borrada en el worktree: protege `.env*` y `escaneos-reales/`). Rutas declaradas en la sección de superficies: T6 y T8 delegadas en paralelo (unidades pesadas, superficies disjoint), T2/T5/T7/T9 en el padre.
- **L6 (2026-11-02)** — Decisión: las primitivas de UI se vendorizan a mano con el mismo contrato de shadcn/ui (`cva` + `tailwind-merge` ya instalados) en lugar de `npx shadcn add`, para no arrastrar `components.json` ni `tw-animate-css` a un proyecto con tokens propios. Se documenta como decisión en `docs/frontend-plan.md`.
- **L7 (2026-11-02)** — Cimiento construido y commiteado: `layout.tsx` con las tres familias, cabecera/pie, primitivas (`boton`, `entrada`, `insignia`, `esqueleto`), repositorio simulado + contexto, `HojaEscaneada` y `RecorteEscaneo`. Evidencia: 42 pruebas, `tsc --noEmit` y `eslint` limpios.
- **L8 (2026-11-02)** — Defecto encontrado por la nueva suite de mocks: `construirCampos` no mapeaba la cabecera del reporte a los campos, así que `cliente`, `fecha`, `equipo`, `tecnico` y `numero_reporte` llegaban `null` con confianza alta. Corregido en `mocks/reportes.ts` (la fecha del campo se escribe como en el talonario, `día/mes/año`, y `fecha_reporte` sigue en ISO).
- **L9 (2026-11-02)** — Decisión: el dibujo del escaneo falso vive en `src/config/escaneo-falso.ts`, no en `src/mocks/escaneo-svg.ts`. Motivo: la regla de oro del proyecto prohíbe que los componentes importen `mocks/`, y el artefacto visual es configuración compartida, no datos simulados. El contenido manuscrito sí llega desde el repositorio.
- **L10 (2026-11-02)** — T7 commiteado (`feat(calibracion)`, `0a81367`): guard `MOSTRAR_CALIBRACION` en `src/config/entorno.ts`, ruta `/dev/regiones` y componentes `mapa-calibracion` y `lista-cobertura`. Evidencia: `tsc --noEmit`, `eslint src` y `vitest run` (42/42) en verde; `next build` compila y pre-renderiza `/`, `/_not-found` y `/dev/regiones`.
- **L11 (2026-11-02)** — T9 avanzado: sección "Frontend" en `app/README.md` (levantamiento, scripts, árbol real y los 6 pasos para reemplazar el repositorio simulado por Supabase), script `test` agregado a `package.json` para que `npm test` coincida con el runner declarado, y árbol de carpetas de `docs/frontend-plan.md` sincronizado con el código (`boton.tsx`, sin `contenedor-app.tsx`, `config/escaneo-falso.ts` en lugar de `mocks/escaneo/`). Commits `docs(readme)` y `docs(plan)`. Queda pendiente de T9 la revisión responsive y de teclado sobre T6/T8.
