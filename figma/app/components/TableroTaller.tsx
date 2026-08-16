import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CirclePause,
  History,
  Play,
  Printer,
  RefreshCw,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { getCurrentUser } from '../auth';
import type { OrdenTaller, TareaTaller, User } from '../types';
import {
  aceptarTareaApi,
  asignarTareaApi,
  finalizarTareaApi,
  iniciarTareaApi,
  listarOrdenesTaller,
  listarUsuarios,
  pausarTareaApi,
  reabrirTareaApi,
} from '../serviciosApi';

const etiquetaEstado: Record<TareaTaller['estado'], string> = {
  DISPONIBLE: 'Disponible',
  ASIGNADA: 'Asignada',
  ACEPTADA: 'Aceptada',
  EN_PROCESO: 'En proceso',
  PENDIENTE: 'Pendiente',
  FINALIZADA: 'Finalizada',
};

const claseEstado: Record<TareaTaller['estado'], string> = {
  DISPONIBLE: 'bg-sky-500/15 text-sky-300',
  ASIGNADA: 'bg-violet-500/15 text-violet-300',
  ACEPTADA: 'bg-amber-500/15 text-amber-300',
  EN_PROCESO: 'bg-primary/15 text-primary',
  PENDIENTE: 'bg-orange-500/15 text-orange-300',
  FINALIZADA: 'bg-green-500/15 text-green-300',
};

export function TableroTaller() {
  const navegar = useNavigate();
  const [usuarioActual] = useState(() => getCurrentUser());
  const [ordenes, setOrdenes] = useState<OrdenTaller[]>([]);
  const [empleados, setEmpleados] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [tareaEnActualizacion, setTareaEnActualizacion] = useState<string>();
  const [historialExpandido, setHistorialExpandido] = useState<string>();
  const [ordenesExpandidas, setOrdenesExpandidas] = useState<string[]>([]);
  const esAdministrador = usuarioActual?.role === 'admin';
  const esEmpleado = usuarioActual?.role === 'empleado';

  const cargar = useCallback(async () => {
    try {
      const [ordenesTaller, usuarios] = await Promise.all([
        listarOrdenesTaller(),
        esAdministrador ? listarUsuarios() : Promise.resolve([]),
      ]);
      setOrdenes(ordenesTaller);
      setEmpleados(usuarios.filter(usuario => usuario.role === 'empleado' && usuario.active !== false));
      setError('');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cargar el tablero del taller');
    } finally {
      setCargando(false);
    }
  }, [esAdministrador]);

  useEffect(() => {
    // La consulta remota actualiza el tablero únicamente después de resolverse.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const ordenConTareaActiva = ordenes.find(orden => orden.tareas.some(tarea =>
    tarea.empleadoAsignado?.id === usuarioActual?.id
      && (tarea.estado === 'ACEPTADA' || tarea.estado === 'EN_PROCESO')));
  const tareaActiva = ordenConTareaActiva?.tareas.find(tarea =>
    tarea.empleadoAsignado?.id === usuarioActual?.id
      && (tarea.estado === 'ACEPTADA' || tarea.estado === 'EN_PROCESO'));
  const idTareaActiva = tareaActiva?.id;
  const idOrdenTareaActiva = ordenConTareaActiva?.id;

  useEffect(() => {
    if (!esEmpleado || !idOrdenTareaActiva) return;
    // La orden de la tarea activa se abre automáticamente para encontrarla sin buscarla.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrdenesExpandidas(actuales => actuales.includes(idOrdenTareaActiva)
      ? actuales
      : [...actuales, idOrdenTareaActiva]);
  }, [esEmpleado, idOrdenTareaActiva]);

  const alternarOrden = (idOrden: string) => {
    setOrdenesExpandidas(actuales => actuales.includes(idOrden)
      ? actuales.filter(id => id !== idOrden)
      : [...actuales, idOrden]);
  };

  const ejecutar = async (idTarea: string, accion: () => Promise<unknown>) => {
    setTareaEnActualizacion(idTarea);
    try {
      await accion();
      await cargar();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo actualizar la tarea');
    } finally {
      setTareaEnActualizacion(undefined);
    }
  };

  const dejarPendiente = (tarea: TareaTaller) => {
    const motivo = window.prompt('Indicá por qué la tarea queda pendiente:')?.trim();
    if (motivo) void ejecutar(tarea.id, () => pausarTareaApi(tarea.id, motivo));
  };

  const finalizar = (tarea: TareaTaller) => {
    const comentario = window.prompt('Observación final (opcional):') || '';
    void ejecutar(tarea.id, () => finalizarTareaApi(tarea.id, comentario));
  };

  const asignar = (tarea: TareaTaller, idEmpleado: string) =>
    void ejecutar(tarea.id, () => asignarTareaApi(tarea.id, idEmpleado || null));

  return <main className="min-h-screen bg-background px-4 py-5 sm:p-6"><div className="mx-auto max-w-6xl">
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-3 text-3xl font-semibold"><Wrench className="h-8 w-8 text-primary" />Tablero del taller</h1><p className="mt-1 text-sm text-muted-foreground">Órdenes recibidas y en proceso · una tarea activa por empleado</p></div><button onClick={() => { setCargando(true); void cargar(); }} disabled={cargando} className="flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />Actualizar</button></header>
    {error ? <div role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">{error}</div> : null}

    {esEmpleado && ordenConTareaActiva && tareaActiva ? <section className="mb-5 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Mi tarea actual</div><h2 className="text-lg font-semibold">{tareaActiva.descripcion}</h2><p className="mt-1 text-sm text-muted-foreground"><span className="font-mono text-primary">{ordenConTareaActiva.numeroOrden}</span> · {ordenConTareaActiva.vehiculo?.descripcion || 'Motor sin descripción'}</p><span className={`mt-3 inline-block rounded px-2 py-1 text-xs ${claseEstado[tareaActiva.estado]}`}>{etiquetaEstado[tareaActiva.estado]}</span></div>
        <div className="flex flex-wrap gap-2">
          {tareaActiva.estado === 'ACEPTADA' ? <button disabled={tareaEnActualizacion === tareaActiva.id} onClick={() => void ejecutar(tareaActiva.id, () => iniciarTareaApi(tareaActiva.id))} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm"><Play className="h-4 w-4" />Comenzar</button> : null}
          <button disabled={tareaEnActualizacion === tareaActiva.id} onClick={() => dejarPendiente(tareaActiva)} className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm"><CirclePause className="h-4 w-4" />Dejar pendiente</button>
          {tareaActiva.estado === 'EN_PROCESO' ? <button disabled={tareaEnActualizacion === tareaActiva.id} onClick={() => finalizar(tareaActiva)} className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm"><CheckCircle2 className="h-4 w-4" />Finalizar</button> : null}
        </div>
      </div>
      <p className="mt-3 border-t border-primary/15 pt-3 text-xs text-muted-foreground">Para tomar otra tarea, primero finalizá esta o dejala pendiente.</p>
    </section> : null}

    {!cargando && ordenes.length === 0 ? <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">No hay órdenes en recepción o en proceso.</div> : null}

    <div className="space-y-4">{ordenes.map(orden => {
      const tareasFinalizadas = orden.tareas.filter(tarea => tarea.estado === 'FINALIZADA').length;
      const tareasTotales = orden.tareas.length;
      const tareasPorCompletar = tareasTotales - tareasFinalizadas;
      const progreso = tareasTotales ? Math.round((tareasFinalizadas / tareasTotales) * 100) : 0;
      const expandida = ordenesExpandidas.includes(orden.id);
      const tieneTareaActiva = Boolean(idTareaActiva && orden.tareas.some(tarea => tarea.id === idTareaActiva));

      return <section key={orden.id} className={`overflow-hidden rounded-xl border bg-card transition-colors ${tieneTareaActiva ? 'border-primary/50' : 'border-border'}`}>
        <header className="bg-secondary/30 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => alternarOrden(orden.id)} aria-expanded={expandida} className="min-w-0 flex-1 text-left">
              <div className="flex items-start gap-3">
                <span className="mt-1 text-muted-foreground">{expandida ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-xl font-semibold text-primary">{orden.numeroOrden}</span>
                    <span className="rounded-md bg-background/60 px-2 py-1 text-sm font-semibold">{tareasFinalizadas}/{tareasTotales} tareas</span>
                    {tieneTareaActiva && esEmpleado ? <span className="rounded bg-primary/15 px-2 py-1 text-xs font-medium text-primary">Tu tarea activa</span> : null}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">{orden.vehiculo?.descripcion || 'Motor sin descripción'} · {orden.vehiculo?.numeroMotor || 'Sin número'} {orden.vehiculo?.patente ? `· ${orden.vehiculo.patente}` : ''}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-background/70"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progreso}%` }} /></div>
                    <span className="w-10 text-right text-xs font-medium text-muted-foreground">{progreso}%</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{tareasFinalizadas} finalizada{tareasFinalizadas === 1 ? '' : 's'} · {tareasPorCompletar} por completar</div>
                </div>
              </div>
            </button>

            <div className="flex shrink-0 items-center gap-2 sm:self-start">
              <span className="rounded bg-secondary px-2 py-1 text-xs">{orden.estado === 'RECEPCION' ? 'Recepción' : 'En proceso'}</span>
              {!esEmpleado ? <button onClick={() => navegar(`/orden/${orden.id}?format=taller`)} className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm"><Printer className="h-4 w-4" />Hoja del taller</button> : null}
            </div>
          </div>
        </header>

        {expandida ? <div className="border-t border-border p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Tareas de la orden</h2><span className="text-xs text-muted-foreground">{tareasPorCompletar} por completar</span></div>
          <div className="space-y-3">{orden.tareas.map(tarea => {
            const propia = tarea.empleadoAsignado?.id === usuarioActual?.id;
            const puedeAceptar = esEmpleado && (tarea.estado === 'DISPONIBLE' || tarea.estado === 'PENDIENTE' || (tarea.estado === 'ASIGNADA' && propia));
            const esTareaActivaPropia = propia && (tarea.estado === 'ACEPTADA' || tarea.estado === 'EN_PROCESO');

            return <article key={tarea.id} className={`rounded-lg border p-4 ${esTareaActivaPropia ? 'border-primary/40 bg-primary/5' : 'border-border bg-background/40'}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="font-medium">{tarea.descripcion}</div><div className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded px-2 py-1 text-xs ${claseEstado[tarea.estado]}`}>{etiquetaEstado[tarea.estado]}</span>{tarea.empleadoAsignado ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="h-3.5 w-3.5" />{tarea.empleadoAsignado.nombre}</span> : null}</div></div><div className="flex flex-wrap gap-2">
              {puedeAceptar ? <button disabled={Boolean(idTareaActiva) || tareaEnActualizacion === tarea.id} onClick={() => void ejecutar(tarea.id, () => aceptarTareaApi(tarea.id))} className="rounded-md bg-primary px-3 py-2 text-sm disabled:opacity-40">Aceptar</button> : null}
              {esEmpleado && propia && tarea.estado === 'ACEPTADA' ? <button disabled={tareaEnActualizacion === tarea.id} onClick={() => void ejecutar(tarea.id, () => iniciarTareaApi(tarea.id))} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm"><Play className="h-4 w-4" />Comenzar</button> : null}
              {esEmpleado && propia && (tarea.estado === 'ACEPTADA' || tarea.estado === 'EN_PROCESO') ? <button disabled={tareaEnActualizacion === tarea.id} onClick={() => dejarPendiente(tarea)} className="flex items-center gap-1 rounded-md bg-secondary px-3 py-2 text-sm"><CirclePause className="h-4 w-4" />Pendiente</button> : null}
              {esEmpleado && propia && tarea.estado === 'EN_PROCESO' ? <button disabled={tareaEnActualizacion === tarea.id} onClick={() => finalizar(tarea)} className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm"><CheckCircle2 className="h-4 w-4" />Finalizar</button> : null}
              {esAdministrador && tarea.estado !== 'FINALIZADA' ? <select aria-label={`Responsable de ${tarea.descripcion}`} value={tarea.empleadoAsignado?.id || ''} onChange={evento => asignar(tarea, evento.target.value)} disabled={tareaEnActualizacion === tarea.id} className="rounded-md border border-border bg-input px-3 py-2 text-sm"><option value="">Sin asignar</option>{empleados.map(empleado => <option key={empleado.id} value={empleado.id}>{empleado.name}</option>)}</select> : null}
              {esAdministrador && tarea.estado === 'FINALIZADA' ? <button onClick={() => void ejecutar(tarea.id, () => reabrirTareaApi(tarea.id))} className="rounded-md bg-secondary px-3 py-2 text-sm">Reabrir</button> : null}
            </div></div>{tarea.notasTecnicas ? <p className="mt-3 whitespace-pre-wrap rounded bg-secondary/30 p-3 text-xs text-muted-foreground">{tarea.notasTecnicas}</p> : null}
            {tarea.historial.length ? <div className="mt-3"><button onClick={() => setHistorialExpandido(historialExpandido === tarea.id ? undefined : tarea.id)} className="flex items-center gap-2 text-xs text-muted-foreground"><History className="h-4 w-4" />{historialExpandido === tarea.id ? 'Ocultar historial' : `Ver historial (${tarea.historial.length})`}</button>{historialExpandido === tarea.id ? <ol className="mt-3 space-y-2 border-l border-border pl-4">{tarea.historial.map((evento, indice) => <li key={`${evento.fecha}-${indice}`} className="text-xs"><span className="font-medium">{evento.actor}</span> · {evento.accion.toLowerCase().replace('_', ' ')} <span className="text-muted-foreground">{new Date(evento.fecha).toLocaleString('es-AR')}</span>{evento.comentario ? <div className="mt-1 text-muted-foreground">{evento.comentario}</div> : null}</li>)}</ol> : null}</div> : null}
            </article>;
          })}</div>
        </div> : null}
      </section>;
    })}</div>
  </div></main>;
}
