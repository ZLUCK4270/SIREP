# SIREP · Bandeja de revisión (frontend)

Next.js 16 + React 19 + Tailwind 4. Muestra los reportes técnicos que la secretaria envía por Telegram: el modelo de IA lee el escaneo y solo los campos dudosos llegan al técnico, junto al recorte de la imagen original.

No tiene datos propios: todo viene de la API del backend (`sirep-back`).

## Puesta en marcha

1. Levanta el backend (puerto 3000): `npm run start:dev` en `sirep-back`.
2. En esta carpeta:
   ```bash
   cp .env.example .env.local
   npm install
   npm run dev          # http://localhost:3001
   ```

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend (por defecto `http://localhost:3000`). |
| `NEXT_PUBLIC_REVISOR_NOMBRE` | Nombre que queda como autor de cada revisión hasta que haya login. |
| `NEXT_PUBLIC_DEV_MODE` | Con `false` oculta la pantalla de calibración. |

El backend debe permitir este origen en CORS (`http://localhost:3001` ya viene permitido en desarrollo; en producción, `FRONTEND_URL`).

## Estructura

- `src/features/revision/services/repositorio-api.ts`: único punto de contacto con el backend.
- `src/config/campos-formulario.ts`: campos del formulario (deben coincidir con `sirep-back/src/escaneos/campos-formulario.ts`).
- `src/config/regiones/`: zona de cada campo sobre el escaneo, para el recorte.
- `src/styles/tokens.css`: identidad visual (claro y oscuro).

## Calibrar las zonas de recorte

Con un reporte ya procesado, abre `http://localhost:3001/dev/regiones?reporte=000214` para ver el mapa dibujado sobre su escaneo real. Si una zona no cae donde está el texto, ajusta `src/config/regiones/talonario-go-service-carta.ts`.

## Pruebas

```bash
npm test        # vitest
npm run lint
npm run build
```

`contrato-backend.test.ts` guarda una respuesta real del backend: si cambia el contrato o un campo, falla aquí primero.

## Reglas del proyecto

- Los escaneos reales no se suben al repositorio (contienen datos de clientes).
- Ninguna clave va en el código: solo en `.env.local`.
