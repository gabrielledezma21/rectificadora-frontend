import { type Permission, type User } from './types';
import { apiConfigurada, guardarToken, limpiarSesionApi, solicitarApi } from './api';

const CURRENT_USER_KEY = 'motor_shop_current_user';

export function initializeUsers(): void {}

export function iniciarDemostracion(): User {
  const usuario: User = { id: 'modo-demostracion', email: 'demo@taller.local', password: '', role: 'usuario', name: 'Operador de demostración', createdAt: new Date().toISOString(), permissions: ['ORDENES_GESTIONAR', 'CLIENTES_DATOS_BASICOS', 'CATALOGO_GESTIONAR', 'PAGOS_REGISTRAR'] };
  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuario));
  return usuario;
}

export function getUsers(): User[] {
  return [];
}

export function saveUser(user: User): void {
  void user;
  throw new Error('La gestión de usuarios requiere conexión con la API');
}

export function deleteUser(userId: string): void {
  void userId;
  throw new Error('La gestión de usuarios requiere conexión con la API');
}

interface RespuestaLogin {
  token: string;
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERADOR' | 'EMPLEADO_TALLER';
  permissions: Permission[];
}

export async function login(email: string, password: string): Promise<User | null> {
  if (!apiConfigurada) return null;
  const respuesta = await solicitarApi<RespuestaLogin>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  const role: User['role'] = respuesta.role === 'ADMIN' ? 'admin' : respuesta.role === 'EMPLEADO_TALLER' ? 'empleado' : 'usuario';
  const usuario: User = { id: respuesta.id, email: respuesta.email, password: '', role, name: respuesta.name, createdAt: new Date().toISOString(), permissions: respuesta.permissions || [] };
  guardarToken(respuesta.token);
  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuario));
  return usuario;
}

export function logout(): void {
  sessionStorage.removeItem(CURRENT_USER_KEY);
  limpiarSesionApi();
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function tienePermiso(permission: Permission): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin' || Boolean(user?.permissions?.includes(permission));
}
