const URL_API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const CLAVE_TOKEN = 'rectificadora_token';
const CLAVE_CSRF = 'rectificadora_csrf';

export const apiConfigurada = Boolean(URL_API);

export function obtenerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token: string): void {
  sessionStorage.setItem(CLAVE_TOKEN, token);
}

export function limpiarSesionApi(): void {
  sessionStorage.removeItem(CLAVE_TOKEN);
  sessionStorage.removeItem(CLAVE_CSRF);
}

async function obtenerCsrf(): Promise<string> {
  const existente = sessionStorage.getItem(CLAVE_CSRF);
  if (existente) return existente;
  const respuesta = await fetch(`${URL_API}/auth/csrf`, { credentials: 'include' });
  if (!respuesta.ok) throw new Error('No se pudo iniciar la sesión segura');
  const datos = await respuesta.json() as { token: string };
  sessionStorage.setItem(CLAVE_CSRF, datos.token);
  return datos.token;
}

export async function solicitarApi<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  if (!apiConfigurada) throw new Error('La API no está configurada');
  const metodo = (opciones.method || 'GET').toUpperCase();
  const encabezados = new Headers(opciones.headers);
  encabezados.set('Content-Type', 'application/json');
  const token = obtenerToken();
  if (token) encabezados.set('Authorization', `Bearer ${token}`);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(metodo)) encabezados.set('X-XSRF-TOKEN', await obtenerCsrf());

  const respuesta = await fetch(`${URL_API}${ruta}`, { ...opciones, headers: encabezados, credentials: 'include' });
  if (respuesta.status === 401) limpiarSesionApi();
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => null) as { message?: string } | null;
    throw new Error(error?.message || 'Ocurrió un error al comunicarse con el servidor');
  }
  if (respuesta.status === 204) return undefined as T;
  return respuesta.json() as Promise<T>;
}
