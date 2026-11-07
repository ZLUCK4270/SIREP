/**
 * Responsabilidad: exponer qué pantallas de desarrollo están disponibles en
 * este build.
 * Existe para que la página de calibración y el enlace de la cabecera decidan
 * con la misma variable: si alguien define `NEXT_PUBLIC_DEV_MODE=false`, la
 * ruta responde 404 y el enlace desaparece, en lugar de dejar un enlace roto.
 */

/** `false` oculta la calibración; cualquier otro valor (o nada) la mantiene. */
export const MOSTRAR_CALIBRACION = process.env.NEXT_PUBLIC_DEV_MODE !== "false";