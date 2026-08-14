import { User } from './types';
import { logActivity } from './audit';

const USERS_KEY = 'motor_shop_users';
const CURRENT_USER_KEY = 'motor_shop_current_user';

// Inicializar con usuario admin por defecto
export function initializeUsers(): void {
  const users = getUsers();
  if (users.length === 0) {
    const adminUser: User = {
      id: crypto.randomUUID(),
      email: 'admin@taller.com',
      password: 'admin123',
      role: 'admin',
      name: 'Administrador',
      createdAt: new Date().toISOString(),
    };
    saveUser(adminUser);
  }
}

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User): void {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);

  if (existingIndex >= 0) {
    users[existingIndex] = user;
    logActivity('Usuario actualizado', `${user.name} · ${user.role}`, 'usuario');
  } else {
    users.push(user);
    logActivity('Usuario creado', `${user.name} · ${user.role}`, 'usuario');
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function deleteUser(userId: string): void {
  const current = getUsers();
  const deleted = current.find(u => u.id === userId);
  const users = current.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (deleted) logActivity('Usuario eliminado', deleted.name, 'usuario');
}

export function login(email: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    // No guardamos la contraseña en el current user
    const userSession = { ...user, password: '' };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
    logActivity('Inicio de sesión', user.name, 'sistema');
    return userSession;
  }

  return null;
}

export function logout(): void {
  logActivity('Cierre de sesión', 'Sesión finalizada', 'sistema');
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
