/**
 * Responsabilidad: auditar campo por campo que exista definición y región
 * válida en el mapa.
 * Existe porque la calibración se mira, pero esta lista la comprueba: una
 * coordenada fuera de rango o una página inexistente no siempre se nota a ojo
 * y su síntoma aparece mucho después, en un recorte vacío.
 */

import { CAMPOS_FORMULARIO, CAMPOS_POR_ID } from "@/config/campos-formulario";
import { Insignia } from "@/components/ui/insignia";
import type { IdCampo } from "@/features/revision/types/campos";
import type { MapaRegiones } from "@/features/revision/types/regiones";

interface ListaCoberturaProps {
    mapa: MapaRegiones;
}

interface DiagnosticoCampo {
    id: IdCampo;
    etiqueta: string;
    pagina: number | null;
    problemas: string[];
}

function diagnosticar(mapa: MapaRegiones, id: IdCampo): DiagnosticoCampo {
    const definicion = CAMPOS_POR_ID[id];
    const region = mapa.regiones[id];
    const problemas: string[] = [];

    if (!definicion) problemas.push("sin definición en el inventario");
    if (!region) {
        return { id, etiqueta: definicion?.etiqueta ?? id, pagina: null, problemas };
    }

    const dentroDeRango =
        region.x >= 0 &&
        region.y >= 0 &&
        region.ancho > 0 &&
        region.alto > 0 &&
        region.x + region.ancho <= 1 &&
        region.y + region.alto <= 1;

    if (!dentroDeRango) problemas.push("coordenadas fuera de 0–1");
    if (region.pagina < 1 || region.pagina > mapa.paginas) {
        problemas.push(`página ${region.pagina} inexistente`);
    }

    return {
        id,
        etiqueta: definicion?.etiqueta ?? id,
        pagina: region.pagina,
        problemas,
    };
}

export function ListaCobertura({ mapa }: ListaCoberturaProps) {
    const diagnosticos = CAMPOS_FORMULARIO.map((definicion) =>
        diagnosticar(mapa, definicion.id),
    );

    // Regiones huérfanas: quedaron en el mapa después de quitar un campo.
    const inventario = new Set<string>(CAMPOS_FORMULARIO.map((c) => c.id));
    const huerfanas = (Object.keys(mapa.regiones) as IdCampo[]).filter(
        (id) => !inventario.has(id),
    );

    const conProblemas = diagnosticos.filter((d) => d.problemas.length > 0);

    return (
        <section aria-labelledby="titulo-cobertura" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <h2 id="titulo-cobertura" className="text-title font-semibold">
                    Cobertura
                </h2>
                <Insignia
                    tono={conProblemas.length === 0 ? "green" : "brick"}
                    tamano="normal"
                >
                    {conProblemas.length === 0
                        ? `${diagnosticos.length} de ${diagnosticos.length} válidos`
                        : `${conProblemas.length} con problemas`}
                </Insignia>
            </div>

            <div className="overflow-hidden rounded-md border border-line bg-raised">
                <table className="w-full border-collapse text-left text-meta">
                    <caption className="sr-only">
                        Estado de cada campo del inventario en el mapa de regiones
                    </caption>
                    <thead>
                        <tr className="border-b border-line bg-sunken text-micro uppercase tracking-label text-faint">
                            <th scope="col" className="px-3 py-2 font-semibold">
                                Campo
                            </th>
                            <th scope="col" className="px-3 py-2 font-semibold">
                                Pág.
                            </th>
                            <th scope="col" className="px-3 py-2 font-semibold">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {diagnosticos.map((diagnostico) => (
                            <tr
                                key={diagnostico.id}
                                className="border-b border-line last:border-b-0"
                            >
                                <td className="px-3 py-2">
                                    <span className="block text-ink">{diagnostico.etiqueta}</span>
                                    <span className="block font-mono text-micro text-faint">
                                        {diagnostico.id}
                                    </span>
                                </td>
                                <td className="px-3 py-2 font-mono text-faint">
                                    {diagnostico.pagina ?? "—"}
                                </td>
                                <td className="px-3 py-2">
                                    {diagnostico.problemas.length === 0 ? (
                                        <Insignia tono="green" tamano="micro">
                                            OK
                                        </Insignia>
                                    ) : (
                                        <span className="flex flex-col gap-1">
                                            {diagnostico.problemas.map((problema) => (
                                                <Insignia key={problema} tono="brick" tamano="micro">
                                                    {problema}
                                                </Insignia>
                                            ))}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {huerfanas.map((id) => (
                            <tr key={id} className="border-b border-line last:border-b-0">
                                <td className="px-3 py-2">
                                    <span className="block text-muted">{id}</span>
                                    <span className="block font-mono text-micro text-faint">
                                        sin campo en el inventario
                                    </span>
                                </td>
                                <td className="px-3 py-2 font-mono text-faint">—</td>
                                <td className="px-3 py-2">
                                    <Insignia tono="brick" tamano="micro">
                                        huérfana
                                    </Insignia>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-meta text-faint">
                El mapa <span className="font-mono">{mapa.id}</span> declara{" "}
                {mapa.ancho_pagina}×{mapa.alto_pagina} px por página y{" "}
                {mapa.paginas} páginas.
            </p>
        </section>
    );
}