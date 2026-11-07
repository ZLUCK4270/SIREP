/**
 * Responsabilidad: identificar a quien firma las revisiones.
 * Existe para que la auditoría de cada campo (quién y cuándo) quede registrada
 * en el servidor. Mientras no exista autenticación, el nombre se toma de
 * `NEXT_PUBLIC_REVISOR_NOMBRE`; si no está definido se usa "Revisor". Antes
 * aparecía una persona inventada en la auditoría.
 *
 * TODO(auth): tomar el usuario del proveedor de identidad de RP-TECH.
 */

export interface UsuarioActual {
  id: string;
  nombre: string;
  iniciales: string;
  rol: string;
}

function calcularIniciales(nombre: string): string {
  const letras = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "");
  return letras.join("") || "R";
}

const NOMBRE = process.env.NEXT_PUBLIC_REVISOR_NOMBRE?.trim() || "Revisor";

export const USUARIO_ACTUAL: UsuarioActual = {
  id: "revisor-local",
  nombre: NOMBRE,
  iniciales: calcularIniciales(NOMBRE),
  rol: "Revisión técnica",
};
