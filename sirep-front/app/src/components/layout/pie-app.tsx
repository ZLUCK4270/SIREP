/**
 * Responsabilidad: pie global de la aplicación.
 * Existe para recordar que los escaneos mostrados contienen datos reales de
 * clientes y que la sesión actual es provisional.
 */

export function PieApp() {
  return (
    <footer className="border-t border-line bg-raised/60">
      <div className="mx-auto flex max-w-(--layout-max) flex-col gap-1 px-(--space-gutter) py-4 text-micro text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>SIREP · Digitalización de reportes técnicos · GO Service Latam</p>
        <p className="uppercase tracking-label">
          Los escaneos contienen datos de clientes: no los compartas fuera del equipo
        </p>
      </div>
    </footer>
  );
}
