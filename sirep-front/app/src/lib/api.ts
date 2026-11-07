/**
 * Cliente HTTP centralizado para comunicarse con el backend de SIREP (NestJS).
 * Usa `fetch` nativo y toma por defecto `process.env.NEXT_PUBLIC_API_URL`.
 */

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = 8000;

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL
).replace(/\/$/, '');

export interface HealthResponse {
  status: 'ok' | string;
  timestamp: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Ejecuta una petición HTTP hacia el backend con soporte para timeout y manejo de errores.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, signal, ...restOptions } = options;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Si el llamador pasó su propio AbortSignal, propagamos su cancelación
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new ApiError('La solicitud fue cancelada.', 0);
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const isFormData =
      typeof FormData !== 'undefined' && restOptions.body instanceof FormData;

    const response = await fetch(url, {
      ...restOptions,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as { message: unknown }).message)
          : `Error HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, body);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        `Tiempo de espera agotado (${timeoutMs}ms) al conectar con ${url}`,
        408,
      );
    }
    throw new ApiError(
      error instanceof Error
        ? `Error de red al conectar con el backend: ${error.message}`
        : 'Error de red desconocido al conectar con el backend',
      0,
    );
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Verifica la conectividad con el backend consultando `GET /health`.
 * Captura errores de red o timeout y retorna un resultado seguro o lanza según se requiera.
 */
export async function checkBackendHealth(
  timeoutMs = 5000,
): Promise<{
  online: boolean;
  status: string;
  timestamp: string | null;
  error?: string;
}> {
  try {
    const data = await apiClient.get<HealthResponse>('/health', {
      timeoutMs,
      cache: 'no-store',
    });

    return {
      online: data.status === 'ok',
      status: data.status,
      timestamp: data.timestamp ?? new Date().toISOString(),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo conectar con el servidor backend.';
    return {
      online: false,
      status: 'error',
      timestamp: null,
      error: message,
    };
  }
}
