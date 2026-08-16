import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, CirclePause, History, Play, Printer, RefreshCw, UserRound, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getCurrentUser } from '../auth';
import type { User, WorkTask, WorkshopOrder } from '../types';
import { aceptarTareaApi, asignarTareaApi, finalizarTareaApi, iniciarTareaApi, listarOrdenesTaller, listarUsuarios, pausarTareaApi, reabrirTareaApi } from '../serviciosApi';

const statusLabel: Record<WorkTask['status'], string> = {
  DISPONIBLE: 'Disponible', ASIGNADA: 'Asignada', ACEPTADA: 'Aceptada', EN_PROCESO: 'En proceso',
  PENDIENTE: 'Pendiente', FINALIZADA: 'Finalizada',
};
const statusClass: Record<WorkTask['status'], string> = {
  DISPONIBLE: 'bg-sky-500/15 text-sky-300', ASIGNADA: 'bg-violet-500/15 text-violet-300',
  ACEPTADA: 'bg-amber-500/15 text-amber-300', EN_PROCESO: 'bg-primary/15 text-primary',
  PENDIENTE: 'bg-orange-500/15 text-orange-300', FINALIZADA: 'bg-green-500/15 text-green-300',
};

export function WorkshopBoard() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyTask, setBusyTask] = useState<string>();
  const [expandedHistory, setExpandedHistory] = useState<string>();
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const isAdmin = currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'empleado';

  const load = useCallback(async () => {
    try {
      const [workshopOrders, users] = await Promise.all([listarOrdenesTaller(), isAdmin ? listarUsuarios() : Promise.resolve([])]);
      setOrders(workshopOrders);
      setEmployees(users.filter(user => user.role === 'empleado' && user.active !== false));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el tablero del taller');
    } finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => {
    // La consulta remota actualiza el tablero únicamente después de resolverse.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const activeTaskInfo = useMemo(() => {
    for (const order of orders) {
      const task = order.tasks.find(candidate => candidate.assignedEmployee?.id === currentUser?.id
        && (candidate.status === 'ACEPTADA' || candidate.status === 'EN_PROCESO'));
      if (task) return { order, task };
    }
    return undefined;
  }, [orders, currentUser?.id]);
  const activeTaskId = activeTaskInfo?.task.id;

  useEffect(() => {
    if (!isEmployee || !activeTaskInfo) return;
    // La orden de la tarea activa se abre automáticamente para encontrarla sin buscarla.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedOrders(current => current.includes(activeTaskInfo.order.id) ? current : [...current, activeTaskInfo.order.id]);
  }, [isEmployee, activeTaskInfo]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(current => current.includes(orderId)
      ? current.filter(id => id !== orderId)
      : [...current, orderId]);
  };

  const run = async (taskId: string, action: () => Promise<unknown>) => {
    setBusyTask(taskId);
    try { await action(); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la tarea'); }
    finally { setBusyTask(undefined); }
  };

  const pause = (task: WorkTask) => {
    const reason = window.prompt('Indicá por qué la tarea queda pendiente:')?.trim();
    if (reason) void run(task.id, () => pausarTareaApi(task.id, reason));
  };
  const complete = (task: WorkTask) => {
    const comment = window.prompt('Observación final (opcional):') || '';
    void run(task.id, () => finalizarTareaApi(task.id, comment));
  };
  const assign = (task: WorkTask, employeeId: string) => void run(task.id, () => asignarTareaApi(task.id, employeeId || null));

  return <main className="min-h-screen bg-background px-4 py-5 sm:p-6"><div className="mx-auto max-w-6xl">
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-3 text-3xl font-semibold"><Wrench className="h-8 w-8 text-primary" />Tablero del taller</h1><p className="mt-1 text-sm text-muted-foreground">Órdenes recibidas y en proceso · una tarea activa por empleado</p></div><button onClick={() => { setLoading(true); void load(); }} disabled={loading} className="flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Actualizar</button></header>
    {error ? <div role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">{error}</div> : null}

    {isEmployee && activeTaskInfo ? <section className="mb-5 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Mi tarea actual</div><h2 className="text-lg font-semibold">{activeTaskInfo.task.description}</h2><p className="mt-1 text-sm text-muted-foreground"><span className="font-mono text-primary">{activeTaskInfo.order.orderNumber}</span> · {activeTaskInfo.order.vehicle?.description || 'Motor sin descripción'}</p><span className={`mt-3 inline-block rounded px-2 py-1 text-xs ${statusClass[activeTaskInfo.task.status]}`}>{statusLabel[activeTaskInfo.task.status]}</span></div>
        <div className="flex flex-wrap gap-2">
          {activeTaskInfo.task.status === 'ACEPTADA' ? <button disabled={busyTask === activeTaskInfo.task.id} onClick={() => void run(activeTaskInfo.task.id, () => iniciarTareaApi(activeTaskInfo.task.id))} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm"><Play className="h-4 w-4" />Comenzar</button> : null}
          <button disabled={busyTask === activeTaskInfo.task.id} onClick={() => pause(activeTaskInfo.task)} className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm"><CirclePause className="h-4 w-4" />Dejar pendiente</button>
          {activeTaskInfo.task.status === 'EN_PROCESO' ? <button disabled={busyTask === activeTaskInfo.task.id} onClick={() => complete(activeTaskInfo.task)} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm"><CheckCircle2 className="h-4 w-4" />Finalizar</button> : null}
        </div>
      </div>
      <p className="mt-3 border-t border-primary/15 pt-3 text-xs text-muted-foreground">Para tomar otra tarea, primero finalizá esta o dejala pendiente.</p>
    </section> : null}

    {!loading && orders.length === 0 ? <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">No hay órdenes en recepción o en proceso.</div> : null}

    <div className="space-y-4">{orders.map(order => {
      const completedTasks = order.tasks.filter(task => task.status === 'FINALIZADA').length;
      const totalTasks = order.tasks.length;
      const remainingTasks = totalTasks - completedTasks;
      const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const expanded = expandedOrders.includes(order.id);
      const hasActiveTask = Boolean(activeTaskId && order.tasks.some(task => task.id === activeTaskId));

      return <section key={order.id} className={`overflow-hidden rounded-xl border bg-card transition-colors ${hasActiveTask ? 'border-primary/50' : 'border-border'}`}>
        <header className="bg-secondary/30 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => toggleOrder(order.id)} aria-expanded={expanded} className="min-w-0 flex-1 text-left">
              <div className="flex items-start gap-3">
                <span className="mt-1 text-muted-foreground">{expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-xl font-semibold text-primary">{order.orderNumber}</span>
                    <span className="rounded-md bg-background/60 px-2 py-1 text-sm font-semibold">{completedTasks}/{totalTasks} tareas</span>
                    {hasActiveTask && isEmployee ? <span className="rounded bg-primary/15 px-2 py-1 text-xs font-medium text-primary">Tu tarea activa</span> : null}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">{order.vehicle?.description || 'Motor sin descripción'} · {order.vehicle?.engineNumber || 'Sin número'} {order.vehicle?.licensePlate ? `· ${order.vehicle.licensePlate}` : ''}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-background/70"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
                    <span className="w-10 text-right text-xs font-medium text-muted-foreground">{progress}%</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{completedTasks} finalizada{completedTasks === 1 ? '' : 's'} · {remainingTasks} por completar</div>
                </div>
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-2 sm:self-start">
              <span className="rounded bg-secondary px-2 py-1 text-xs">{order.status === 'RECEPCION' ? 'Recepción' : 'En proceso'}</span>
              {!isEmployee ? <button onClick={() => navigate(`/orden/${order.id}?format=taller`)} className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm"><Printer className="h-4 w-4" />Hoja del taller</button> : null}
            </div>
          </div>
        </header>

        {expanded ? <div className="border-t border-border p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Tareas de la orden</h2><span className="text-xs text-muted-foreground">{remainingTasks} por completar</span></div>
          <div className="space-y-3">{order.tasks.map(task => {
            const owned = task.assignedEmployee?.id === currentUser?.id;
            const canAccept = isEmployee && (task.status === 'DISPONIBLE' || task.status === 'PENDIENTE' || (task.status === 'ASIGNADA' && owned));
            const isOwnActiveTask = owned && (task.status === 'ACEPTADA' || task.status === 'EN_PROCESO');

            return <article key={task.id} className={`rounded-lg border p-4 ${isOwnActiveTask ? 'border-primary/40 bg-primary/5' : 'border-border bg-background/40'}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="font-medium">{task.description}</div><div className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded px-2 py-1 text-xs ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>{task.assignedEmployee ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" />{task.assignedEmployee.name}</span> : null}</div></div><div className="flex flex-wrap gap-2">
              {canAccept ? <button disabled={Boolean(activeTaskId) || busyTask === task.id} onClick={() => void run(task.id, () => aceptarTareaApi(task.id))} className="rounded-md bg-primary px-3 py-2 text-sm disabled:opacity-40">Aceptar</button> : null}
              {isEmployee && owned && task.status === 'ACEPTADA' ? <button disabled={busyTask === task.id} onClick={() => void run(task.id, () => iniciarTareaApi(task.id))} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm"><Play className="h-4 w-4" />Comenzar</button> : null}
              {isEmployee && owned && (task.status === 'ACEPTADA' || task.status === 'EN_PROCESO') ? <button disabled={busyTask === task.id} onClick={() => pause(task)} className="flex items-center gap-1 rounded-md bg-secondary px-3 py-2 text-sm"><CirclePause className="h-4 w-4" />Pendiente</button> : null}
              {isEmployee && owned && task.status === 'EN_PROCESO' ? <button disabled={busyTask === task.id} onClick={() => complete(task)} className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm"><CheckCircle2 className="h-4 w-4" />Finalizar</button> : null}
              {isAdmin && task.status !== 'FINALIZADA' ? <select aria-label={`Responsable de ${task.description}`} value={task.assignedEmployee?.id || ''} onChange={event => assign(task, event.target.value)} disabled={busyTask === task.id} className="rounded-md border border-border bg-input px-3 py-2 text-sm"><option value="">Sin asignar</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select> : null}
              {isAdmin && task.status === 'FINALIZADA' ? <button onClick={() => void run(task.id, () => reabrirTareaApi(task.id))} className="rounded-md bg-secondary px-3 py-2 text-sm">Reabrir</button> : null}
            </div></div>{task.technicalNotes ? <p className="mt-3 whitespace-pre-wrap rounded bg-secondary/30 p-3 text-xs text-muted-foreground">{task.technicalNotes}</p> : null}
            {task.history.length ? <div className="mt-3"><button onClick={() => setExpandedHistory(expandedHistory === task.id ? undefined : task.id)} className="flex items-center gap-2 text-xs text-muted-foreground"><History className="h-4 w-4" />{expandedHistory === task.id ? 'Ocultar historial' : `Ver historial (${task.history.length})`}</button>{expandedHistory === task.id ? <ol className="mt-3 space-y-2 border-l border-border pl-4">{task.history.map((event, index) => <li key={`${event.occurredAt}-${index}`} className="text-xs"><span className="font-medium">{event.actor}</span> · {event.action.toLowerCase().replace('_', ' ')} <span className="text-muted-foreground">{new Date(event.occurredAt).toLocaleString('es-AR')}</span>{event.comment ? <div className="mt-1 text-muted-foreground">{event.comment}</div> : null}</li>)}</ol> : null}</div> : null}
            </article>;
          })}</div>
        </div> : null}
      </section>;
    })}</div>
  </div></main>;
}
