import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { CabeceraApp } from "@/components/layout/cabecera-app";
import { PieApp } from "@/components/layout/pie-app";
import { ProveedorRepositorio } from "@/features/revision/providers/repositorio-contexto";

import "./globals.css";

/*
 * Dos familias: Inter para la interfaz y JetBrains Mono para todo lo que se
 * copia o se compara (N°, códigos, horas). Los nombres de variable son los que
 * `tokens.css` espera.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SIREP · Bandeja de revisión",
    template: "%s · SIREP",
  },
  description:
    "Revisión de reportes técnicos escaneados: el modelo lee el documento y solo lo dudoso llega al técnico, junto al recorte del escaneo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a href="#contenido" className="salto-contenido">
          Saltar al contenido
        </a>
        <ProveedorRepositorio>
          <Suspense
            fallback={<div className="h-(--header-h) border-b border-line bg-raised" />}
          >
            <CabeceraApp />
          </Suspense>
          <main id="contenido" tabIndex={-1} className="flex-1">
            {children}
          </main>
          <PieApp />
        </ProveedorRepositorio>
      </body>
    </html>
  );
}
