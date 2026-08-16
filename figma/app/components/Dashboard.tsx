import { useNavigate } from 'react-router';
import { AlertTriangle, ArrowRight, Banknote, CheckCircle2, Clock3, Plus, Users, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cargarOrdenes } from '../store';
import { cargarClientes, type Client } from '../clientStore';
import { cargarAuditoria, type AuditEntry } from '../audit';
import { getCurrentUser } from '../auth';
import type { WorkOrder } from '../types';

const money = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

export function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const canFinance = user?.role === 'admin' || user?.permissions?.includes('FINANZAS_VER');
  const canAudit = user?.role === 'admin' || user?.permissions?.includes('AUDITORIA_VER');
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());
  useEffect(() => { Promise.all([cargarOrdenes(), cargarClientes(), canAudit ? cargarAuditoria() : Promise.resolve([])])
    .then(([o, c, a]) => { setOrders(o.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())); setClients(c); setAudit(a.slice(0, 5)); })
    .catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos')); }, [canAudit]);
  const active = orders.filter(o => o.estado !== 'finalizado');
  const finished = orders.filter(o => o.estado === 'finalizado');
  const pending = orders.reduce((sum, o) => sum + o.saldo, 0);
  const overdue = active.filter(o => now - new Date(o.date).getTime() > 7 * 86400000);
  const cards: Array<{ label: string; value: string | number; note: string; Icon: LucideIcon; tone: string }> = [
    { label: 'Órdenes activas', value: active.length, note: 'En recepción o proceso', Icon: Wrench, tone: 'text-blue-400' },
    { label: 'Listas para entregar', value: finished.length, note: 'Trabajos finalizados', Icon: CheckCircle2, tone: 'text-green-400' },
    ...(canFinance ? [{ label: 'Saldo pendiente', value: money(pending), note: `${orders.filter(o => o.saldo > 0).length} órdenes con deuda`, Icon: Banknote, tone: 'text-yellow-400' }] : []),
    { label: 'Clientes registrados', value: clients.length, note: `${clients.reduce((n, c) => n + c.vehiculos.length, 0)} vehículos asociados`, Icon: Users, tone: 'text-primary' },
  ];

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {error && <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">{error}</div>}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-primary font-semibold mb-2">Panel general</div>
            <h1 className="text-4xl font-semibold tracking-tight">Buen día, {user?.name}</h1>
            <p className="text-muted-foreground mt-2">{canFinance ? 'Estado operativo y financiero del taller en tiempo real.' : 'Estado operativo de los trabajos del taller.'}</p>
          </div>
          <button onClick={() => navigate('/crear')} className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-md flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> Nueva orden
          </button>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(({ label, value, note, Icon, tone }) => (
            <article key={label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4"><span className="text-sm text-muted-foreground">{label}</span><Icon className={`w-5 h-5 ${tone}`} /></div>
              <div className="text-3xl font-bold font-mono">{value}</div><p className="text-xs text-muted-foreground mt-2">{note}</p>
            </article>
          ))}
        </section>

        {overdue.length > 0 && <section className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0" /><div className="flex-1"><b className="text-yellow-300">{overdue.length} orden{overdue.length > 1 ? 'es' : ''} con más de 7 días</b><p className="text-sm text-muted-foreground">Conviene revisar su avance y avisar al cliente.</p></div>
          <button onClick={() => navigate('/ordenes')} className="text-sm text-yellow-300 flex items-center gap-1">Revisar <ArrowRight className="w-4 h-4" /></button>
        </section>}

        <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between"><div><h2 className="text-xl font-semibold">Órdenes recientes</h2><p className="text-sm text-muted-foreground">Últimos ingresos al taller</p></div><button onClick={() => navigate('/ordenes')} className="text-sm text-primary flex items-center gap-1">Ver todas <ArrowRight className="w-4 h-4" /></button></div>
            <div className="divide-y divide-border">{orders.slice(0, 5).map(order => <button key={order.id} onClick={() => navigate(`/orden/${order.id}`)} className="w-full p-4 hover:bg-secondary/30 flex items-center gap-4 text-left">
              <span className="font-mono text-primary font-semibold w-24">{order.orderNumber}</span><span className="flex-1"><b className="block">{order.cliente}</b><small className="text-muted-foreground">{order.motor}</small></span>{canFinance && <span className="hidden md:block text-right"><b className="block font-mono">{money(order.total)}</b><small className="text-muted-foreground">Saldo {money(order.saldo)}</small></span>}<ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>)}</div>
          </div>
          {canAudit && <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border"><h2 className="text-xl font-semibold">Actividad reciente</h2><p className="text-sm text-muted-foreground">Últimos cambios realizados</p></div>
            <div className="p-5 space-y-4">{audit.length ? audit.map(item => <div key={item.id} className="flex gap-3"><div className="p-2 bg-secondary rounded-lg h-fit"><Clock3 className="w-4 h-4 text-primary" /></div><div><b className="text-sm block">{item.action}</b><span className="text-xs text-muted-foreground block">{item.detail}</span><small className="text-xs text-muted-foreground">{item.user} · {new Date(item.date).toLocaleString('es-AR')}</small></div></div>) : <p className="text-sm text-muted-foreground">Todavía no hay actividad registrada.</p>}</div>
          </div>}
        </section>
      </div>
    </main>
  );
}
