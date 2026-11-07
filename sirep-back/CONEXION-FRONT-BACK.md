# Documentación de Conexión Frontend ↔ Backend (SIREP)

**Autor:** kevinBK  
**Fecha:** 2026-11-02  
**Proyecto:** SIREP (Digitalización de Reportes Técnicos)

---

## 1. Arquitectura de Comunicación

| Servicio | Framework | Ruta Local | Puerto / URL por defecto |
| :--- | :--- | :--- | :--- |
| **Backend (API)** | NestJS | `/home/satanic/sirep-back` | `http://localhost:3001` |
| **Frontend (Web)** | Next.js (App Router) | `/home/satanic/sirep-front/app` | `http://localhost:3000` |

---

## 2. Configuración del Backend (`sirep-back`)

### 2.1. Políticas de CORS
El backend valida los orígenes entrantes mediante `corsOriginCallback` en `src/common/cors.util.ts`, habilitado desde `src/main.ts`:
- Permite explícitamente `http://localhost:3000` en desarrollo (`ORIGENES_DEV`), evitando el uso de comodines inseguros (`*`).
- Permite orígenes adicionales configurados mediante la variable de entorno `FRONTEND_URL` (separados por comas).

### 2.2. Endpoint de Verificación de Salud (`/health`)
Ubicado en `src/health/health.controller.ts`, expone `GET /health` sin consultar la base de datos para comprobar disponibilidad inmediata:

```json
{
  "status": "ok",
  "timestamp": "2026-11-02T20:22:00.000Z"
}
```

---

## 3. Configuración del Frontend (`sirep-front/app`)

### 3.1. Variables de Entorno
- **`.env.local`** (ignorado por Git): Define la URL activa hacia el backend local:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```
- **`.env.example`** (versionado en Git): Plantilla pública sin credenciales ni secretos.

### 3.2. Cliente HTTP Centralizado (`src/lib/api.ts`)
Implementado con `fetch` nativo de TypeScript/Next.js:
- **`API_BASE_URL`**: Toma `process.env.NEXT_PUBLIC_API_URL` (o `http://localhost:3001` por defecto).
- **`apiClient`**: Métodos tipados `get`, `post`, `put`, `patch` y `delete` con soporte para JSON y `FormData`.
- **Manejo de errores y Timeouts**: Usa `AbortController` (8000 ms por defecto) y lanza instancias de `ApiError` con código de estado HTTP y detalle del error.
- **`checkBackendHealth()`**: Consulta `GET /health` y devuelve `{ online, status, timestamp, error }` de forma segura.

---

## 4. Seguridad y Control de Versiones (`.gitignore`)

Tanto en `sirep-back`, `sirep-front` como en `sirep-front/app`, los archivos `.gitignore` están configurados bajo la regla:

```gitignore
.env*
!.env.example
```

Esto garantiza que ningún archivo `.env` o `.env.local` con claves privadas sea indexado en Git, exponiendo únicamente las plantillas `.env.example`.

---

## 5. Ejemplo de Uso en Componentes de Next.js

```tsx
"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth } from "@/lib/api";

export function EstadoBackend() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then((res) => setOnline(res.online));
  }, []);

  if (online === null) return <span>Comprobando conexión...</span>;
  return <span>Estado API: {online ? "En línea" : "Sin conexión"}</span>;
}
```
