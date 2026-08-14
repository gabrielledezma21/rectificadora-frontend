export interface AuditEntry {
  id: string;
  date: string;
  user: string;
  action: string;
  detail: string;
  category: 'orden' | 'cliente' | 'pago' | 'usuario' | 'sistema';
}

const AUDIT_KEY = 'motor_shop_audit';

export function getAuditEntries(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(AUDIT_KEY);
  return data ? JSON.parse(data) : [];
}

export function logActivity(action: string, detail: string, category: AuditEntry['category'] = 'sistema'): void {
  if (typeof window === 'undefined') return;
  const session = localStorage.getItem('motor_shop_current_user');
  const user = session ? JSON.parse(session).name : 'Sistema';
  const entries = getAuditEntries();
  entries.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), user, action, detail, category });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, 500)));
}
