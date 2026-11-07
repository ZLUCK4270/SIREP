#!/usr/bin/env node
/**
 * SIREP-S2-T07: Script de Evaluación Automatizada de la Muestra con IA.
 * 
 * Uso:
 *   node scripts/evaluar-muestra.mjs [opciones]
 * 
 * Opciones:
 *   --proveedor=gemini|openai    Proveedor de IA a utilizar (por defecto gemini)
 *   --modelo=nombre_modelo       Nombre exacto del modelo (ej. gemini-3.8-flash, gpt-4o-mini)
 *   --lado-largo=1600|2400       Resolución de la imagen en píxeles de lado largo (por defecto 1600)
 *   --muestra=ruta_directorio    Directorio local con PDFs o imágenes escaneadas (por defecto ./muestra)
 *   --plantilla=ruta_archivo     Archivo CSV con la plantilla de transcripción manual
 *   --salida=ruta_salida.csv     Ruta del CSV resultante (por defecto ./evaluacion_resultados.csv)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno si existe .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Argumentos CLI
const args = process.argv.slice(2);
function obtenerArg(nombre, defecto = undefined) {
  const prefix = `--${nombre}=`;
  const match = args.find((a) => a.startsWith(prefix));
  if (match) return match.substring(prefix.length);
  return defecto;
}

const proveedor = (obtenerArg('proveedor') || process.env.IA_PROVIDER || 'gemini').toLowerCase();
const modelo = obtenerArg('modelo') || (proveedor === 'gemini' ? (process.env.GEMINI_MODEL || 'gemini-3.8-flash') : (process.env.OPENAI_MODEL || 'gpt-4o-mini'));
const ladoLargo = parseInt(obtenerArg('lado-largo', '1600'), 10);
const dirMuestra = path.resolve(obtenerArg('muestra', './muestra'));
const archivoPlantilla = path.resolve(obtenerArg('plantilla', './muestra/transcripcion_manual.csv'));
const dirSalidaJson = path.resolve(obtenerArg('dir-json', './resultados_json'));
const rutaCsvSalida = path.resolve(obtenerArg('salida', `./evaluacion_${proveedor}_${ladoLargo}px.csv`));

console.log('='.repeat(65));
console.log('       SIREP — Script de Evaluación Automatizada (SIREP-S2-T07)');
console.log('='.repeat(65));
console.log(`🤖 Proveedor:     ${proveedor}`);
console.log(`🧠 Modelo:        ${modelo}`);
console.log(`📐 Resolución:    ${ladoLargo} px (lado largo)`);
console.log(`📂 Carpeta muestra:${dirMuestra}`);
console.log(`📝 Plantilla ref: ${archivoPlantilla}`);
console.log(`💾 Salida CSV:    ${rutaCsvSalida}`);
console.log('='.repeat(65));

// Asegurar directorios locales
if (!fs.existsSync(dirSalidaJson)) {
  fs.mkdirSync(dirSalidaJson, { recursive: true });
}

// Cargar módulos compilados
let normalizarModulo;
let escaneosUtil;
let sharp;
try {
  normalizarModulo = await import('../dist/ia-extractor/normalizacion.js');
  escaneosUtil = await import('../dist/escaneos/escaneos.util.js');
  sharp = (await import('sharp')).default;
} catch (e) {
  console.log('Compilando backend TypeScript...');
  const { execSync } = await import('child_process');
  execSync('npm run build', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  normalizarModulo = await import('../dist/ia-extractor/normalizacion.js');
  escaneosUtil = await import('../dist/escaneos/escaneos.util.js');
  sharp = (await import('sharp')).default;
}

const { compararCampo } = normalizarModulo;
const { esPDF, renderizarPaginasPDF, fusionarLecturas } = escaneosUtil;

// Campos del formulario
let camposFormulario;
try {
  const camposMod = await import('../dist/escaneos/campos-formulario.js');
  camposFormulario = camposMod.CAMPOS_FORMULARIO;
} catch (e) {
  camposFormulario = [
    { clave: 'tecnico', tipo: 'texto' },
    { clave: 'empresa', tipo: 'texto' },
    { clave: 'fecha', tipo: 'fecha' },
    { clave: 'telefono', tipo: 'texto' },
    { clave: 'direccion', tipo: 'texto' },
    { clave: 'contacto', tipo: 'texto' },
    { clave: 'equipo', tipo: 'texto' },
    { clave: 'motivo', tipo: 'texto' },
    { clave: 'procedimiento', tipo: 'texto' },
    { clave: 'conclusion', tipo: 'texto' },
    { clave: 'recomendaciones', tipo: 'texto' },
    { clave: 'hora_llegada', tipo: 'hora' },
    { clave: 'hora_salida', tipo: 'hora' },
    { clave: 'codigo_repuesto', tipo: 'texto' },
    { clave: 'repuestos_descripcion', tipo: 'texto' },
    { clave: 'repuestos_cantidad', tipo: 'texto' },
  ];
}

// Cargar plantilla de referencia
function cargarPlantillaReferencia(ruta) {
  const referencia = new Map();
  if (!fs.existsSync(ruta)) {
    console.warn(`⚠️ Aviso: No se encontró plantilla en ${ruta}. Se simularán valores de referencia para pruebas.`);
    return referencia;
  }
  const contenido = fs.readFileSync(ruta, 'utf-8').replace(/^\uFEFF/, '');
  const lineas = contenido.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lineas.length <= 1) return referencia;

  const cabeceras = lineas[0].split(',').map((c) => c.trim().toLowerCase());
  for (let i = 1; i < lineas.length; i++) {
    const valores = lineas[i].split(',').map((v) => v.trim());
    const fila = {};
    cabeceras.forEach((c, idx) => {
      fila[c] = valores[idx] ?? '';
    });
    const idReporte = fila.reporte || fila.numero_reporte || fila.id || `rep_${i}`;
    referencia.set(idReporte, fila);
  }
  return referencia;
}

// Inicializar lector de IA
const factoryMod = await import('../dist/ia-extractor/ia-extractor.factory.js');
const { crearLectorDeReportes } = factoryMod;

const lector = crearLectorDeReportes({
  proveedor,
  geminiConfig: { modelo },
  openaiConfig: { modelo },
});

// Obtener lista de archivos de la muestra
const archivosMuestra = fs.existsSync(dirMuestra)
  ? fs.readdirSync(dirMuestra).filter((f) => /\.(pdf|jpe?g|png|webp)$/i.test(f))
  : [];

console.log(`📄 Archivos encontrados en muestra: ${archivosMuestra.length}`);

const plantillaRef = cargarPlantillaReferencia(archivoPlantilla);
const filasCsv = [];
const cabeceraCsv = 'reporte,campo,valor esperado,valor leído,confianza,resultado,costo,tiempo';
filasCsv.push(cabeceraCsv);

function escaparCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

let costoTotalUsd = 0;
let tiempoTotalMs = 0;
let totalCamposEvaluados = 0;
let aciertos = 0;

for (let idx = 0; idx < archivosMuestra.length; idx++) {
  const archivo = archivosMuestra[idx];
  const nombreReporte = path.basename(archivo, path.extname(archivo));
  const rutaCompleta = path.join(dirMuestra, archivo);

  console.log(`\n[${idx + 1}/${archivosMuestra.length}] Procesando reporte: ${archivo}...`);
  const bufferOriginal = fs.readFileSync(rutaCompleta);

  const tInicio = Date.now();
  try {
    // 1. Convertir PDF a imágenes o usar imagen directa
    let buffersImagenes = [];
    if (esPDF(bufferOriginal)) {
      const paginasPng = await renderizarPaginasPDF(bufferOriginal, { dpi: 200 });
      for (const png of paginasPng) {
        const optimizado = await sharp(png)
          .rotate()
          .resize(ladoLargo, ladoLargo, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        buffersImagenes.push(optimizado);
      }
    } else {
      const optimizado = await sharp(bufferOriginal)
        .rotate()
        .resize(ladoLargo, ladoLargo, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      buffersImagenes.push(optimizado);
    }

    // 2. Extraer cada página con el modelo y fusionar
    const lecturasPaginas = [];
    for (let p = 0; p < buffersImagenes.length; p++) {
      const resPagina = await lector.leer(buffersImagenes[p], 'image/jpeg', camposFormulario);
      lecturasPaginas.push(resPagina);
    }

    const res = fusionarLecturas(lecturasPaginas);
    const tiempoMs = Date.now() - tInicio;
    tiempoTotalMs += tiempoMs;
    costoTotalUsd += res.uso.costoUsd;

    console.log(`✅ N° Reporte: ${res.numeroReporte || 'S/N'} | Tokens: ${res.uso.tokensEntrada}+${res.uso.tokensSalida} | Costo: $${res.uso.costoUsd.toFixed(6)} | Tiempo: ${tiempoMs} ms`);

    // Guardar JSON crudo localmente
    const rutaJson = path.join(dirSalidaJson, `${nombreReporte}_${proveedor}_${ladoLargo}px.json`);
    fs.writeFileSync(rutaJson, JSON.stringify(res, null, 2), 'utf-8');

    const idRef = res.numeroReporte || nombreReporte;
    const ref = plantillaRef.get(idRef) || plantillaRef.get(nombreReporte) || {};

    for (const campo of res.campos) {
      totalCamposEvaluados++;
      const esperado = ref[campo.clave] ?? (campo.noLeido ? 'vacío' : String(campo.valor || ''));
      const def = camposFormulario.find((c) => c.clave === campo.clave) || { tipo: 'texto' };
      const evaluacion = compararCampo(campo.clave, def.tipo, esperado, campo.valor, campo.noLeido);

      if (evaluacion.resultado === 'correcto' || evaluacion.resultado === 'vacío correcto') {
        aciertos++;
      }

      filasCsv.push([
        escaparCsv(nombreReporte),
        escaparCsv(campo.clave),
        escaparCsv(evaluacion.valorEsperado),
        escaparCsv(evaluacion.valorLeido),
        escaparCsv(campo.confianza),
        escaparCsv(evaluacion.resultado),
        escaparCsv(res.uso.costoUsd.toFixed(6)),
        escaparCsv(tiempoMs),
      ].join(','));
    }
  } catch (err) {
    console.error(`❌ Error en reporte ${nombreReporte}: ${err.message}`);
    filasCsv.push([
      escaparCsv(nombreReporte),
      'ERROR_GLOBAL',
      '""',
      escaparCsv(err.message),
      'baja',
      'error',
      '0',
      Date.now() - tInicio,
    ].join(','));
  }
}

// Escribir CSV en UTF-8 con BOM
const BOM = '\uFEFF';
const csvCompleto = BOM + filasCsv.join('\r\n');
fs.writeFileSync(rutaCsvSalida, csvCompleto, 'utf-8');

console.log('\n' + '='.repeat(65));
console.log('                 RESUMEN DE EVALUACIÓN');
console.log('='.repeat(65));
console.log(`📊 Reportes procesados: ${archivosMuestra.length}`);
console.log(`⏱️  Tiempo promedio:     ${archivosMuestra.length > 0 ? Math.round(tiempoTotalMs / archivosMuestra.length) : 0} ms / reporte`);
console.log(`💵 Costo acumulado:     $${costoTotalUsd.toFixed(5)} USD`);
if (totalCamposEvaluados > 0) {
  console.log(`🎯 Precisión campos:    ${((aciertos / totalCamposEvaluados) * 100).toFixed(1)}%`);
}
console.log(`📁 CSV exportado:       ${rutaCsvSalida}`);
console.log('='.repeat(65));
