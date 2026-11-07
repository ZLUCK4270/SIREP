/**
 * Responsabilidad: entregar el repositorio de reportes a los componentes sin
 * que ellos conozcan la API.
 * El repositorio se puede inyectar por props (pruebas) y si nadie lo aporta, se
 * crea uno solo por montaje.
 */

"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { RepositorioReportes } from "@/features/revision/types/dominio";

import { crearRepositorio } from "../services";

const RepositorioContext = createContext<RepositorioReportes | null>(null);

interface ProveedorRepositorioProps {
  children: ReactNode;
  /** Permite inyectar una implementación distinta (pruebas). */
  repositorio?: RepositorioReportes;
}

export function ProveedorRepositorio({
  children,
  repositorio,
}: ProveedorRepositorioProps) {
  // Se crea una sola vez por montaje para que las acciones de revisión se
  // reflejen en toda la app y no se pierdan al navegar entre pantallas.
  const [instancia] = useState(() => repositorio ?? crearRepositorio());

  const valor = useMemo(() => instancia, [instancia]);

  return (
    <RepositorioContext.Provider value={valor}>
      {children}
    </RepositorioContext.Provider>
  );
}

export function useRepositorio(): RepositorioReportes {
  const repositorio = useContext(RepositorioContext);
  if (!repositorio) {
    // Falla ruidosa: un componente fuera del proveedor no tendría datos y el
    // error sería ilegible sin este mensaje.
    throw new Error(
      "useRepositorio debe usarse dentro de <ProveedorRepositorio>.",
    );
  }
  return repositorio;
}
