import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, History, PauseCircle, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { solicitarApi } from '../api';
import { aceptarTareaApi } from '../serviciosApi';
import type { AccionTareaTaller, EstadoTareaTaller, VehiculoTaller } from '../types';

interface VehiculoHistorialApi {
  id: string;
  description: string;
  engineNumber?: string;
  licensePlate?: string;
}

interface EntradaHistorialApi {
  idTarea: string;
  descripcionTarea: string;
  idOrden: string;
  numeroOrden: string;
  vehiculo?: VehiculoHistorialApi;
  accion: AccionTareaTaller;
  fecha: string;
  comentario?: string;
  estadoActual: EstadoTareaTaller;
}

interface EntradaHistorialEmpleado {
  idTarea: string;
  descripcionTarea: string;
  idOrden: string;
  numeroOrden: string;
  vehiculo?: VehiculoTaller;
  accion: AccionTareaTaller;
  fecha: string;
  comentario?: string;
  estadoActual: EstadoTareaTaller;
}

type FiltroHistorial = 'todas' | 'finalizadas' | 'pendientes';

function adaptarEntradaHistorial(entrada: EntradaHistorialApi): EntradaHistorialEmpleado {
  return {
    idTarea: entrada.idTarea,
    descripcionTarea: entrada.descripcionTarea,
    idOrden: entrada.idOrden,
    numeroOrden: entrada.numeroOrden,
    vehiculo: entrada.vehiculo ? {
      id: entrada.vehiculo.id,
      descripcion: entrada.vehiculo.description,
      numeroMotor: entrada.vehiculo.engineNumber,
      patente: entrada.vehiculo.licensePlate,
    } : undefined,
    accion: entrada.accion,
    fecha: entrada.fecha,
    comentario: entrada.comentario,
    estadoActual: entrada.estadoActual,
  };
}

export function HistorialTareasEmpleado() {
  const navegar = useNavigate();
  const [entradas, setEntradas] = useState<EntradaHistorialEmpleado[]>([]);
  const [filtro, setFiltro] = useState<FiltroHistorial>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [tareaOcupada, setTareaOcupada] = useState<string>();
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await solicitarApi<EntradaHistorialApi[]>('/workshop/mi-historial');
      setEntradas(datos.map(adaptarEntradaHistorial));
      setError('');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cargar tu historial');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const entradasVisibles = useMemo(() => {
    const textoNormalizado = busqueda.trim().toLocaleLowerCase('es-AR');
    return entradas.filter(entrada => {
      if (filtro === 'finalizadas' && entrada.accion !== 'FINALIZADA') return false;
      if (filtro === 'pendientes' && entrada.accion !== 'PAUSADA') return false;
      if (!textoNormalizado) return true;
      const textoBusqueda = [entrada.numeroOrden, entrada.descripcionTarea, entrada.vehiculo?.descripcion,
        entrada.vehiculo?.numeroMotor, entrada.vehiculo?.patente, entrada.comentario]
        .filter(Boolean).join(' ').toLocaleLowerCase('es-AR');
      return textoBusqueda.includes(textoNormalizado);
    });
  }, [entradas, filtro, busqueda]);

  const retomar = async (entrada: EntradaHistorialEmpleado) => {
    setTareaOcupada(entrada.idTarea);
    try {
      await aceptarTareaApi(entrada.idTarea);
      navegar('/taller');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo retomar la tarea');
      await cargar();
    } finally {
      setTareaOcupada(undefined);
    }
  };

  const cantidades = useMemo(() => ({
    finalizadas: entradas.filter(entrada => entrada.accion === 'FINALIZADA').length,
    pendientes: entradas.filter(entrada => entrada.accion === 'PAUSADA').length,
  }), [entradas]);

  return <main className="min-h-screen bg-background px-4 py-5 sm:p-6"><div className="mx-auto max-w-5xl">
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="flex items-center gap-3 text-3xl font-semibold"><History className="h-8 w-8 text-primary" />Mi historial</h1><p className="mt-1 text-sm text-muted-foreground">Tareas que realizaste y tareas que dejaste pendientes.</p></div>
      <button onClick={() => void cargar()} disabled={cargando} className="flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />Actualizar</button>
    </header>

    {error ? <div role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">{error}</div> : null}

    <div className="mb-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-green-400" />Tareas realizadas</div><div className="mt-2 text-2xl font-semibold">{cantidades.finalizadas}</div></div>
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><PauseCircle className="h-4 w-4 text-orange-300" />Veces que dejaste una tarea pendiente</div><div className="mt-2 text-2xl font-semibold">{cantidades.pendientes}</div></div>
    </div>

    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2">
        {([['todas', 'Todas'], ['finalizadas', 'Realizadas'], ['pendientes', 'Dejadas pendientes']] as const).map(([valor, etiqueta]) =>
          <button key={valor} onClick={() => setFiltro(valor)} className={`rounded-md px-3 py-2 text-sm ${filtro === valor ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>{etiqueta}</button>)}
      </div>
      <label className="relative flex-1 sm:ml-auto sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={busqueda} onChange={evento => setBusqueda(evento.target.value)} placeholder="Buscar OT, tarea o motor" className="w-full rounded-md border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" /></label>
    </div>

    {!cargando && entradasVisibles.length === 0 ? <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">No hay tareas para mostrar con estos filtros.</div> : null}

    <div className="space-y-3">{entradasVisibles.map((entrada, indice) => {
      const finalizada = entrada.accion === 'FINALIZADA';
      const puedeRetomar = entrada.accion === 'PAUSADA' && entrada.estadoActual === 'PENDIENTE';
      return <article key={`${entrada.idTarea}-${entrada.fecha}-${indice}`} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><span className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${finalizada ? 'bg-green-500/15 text-green-300' : 'bg-orange-500/15 text-orange-300'}`}>{finalizada ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}{finalizada ? 'Realizada' : 'Dejada pendiente'}</span><span className="font-mono text-sm font-semibold text-primary">{entrada.numeroOrden}</span></div>
            <h2 className="mt-2 text-base font-semibold">{entrada.descripcionTarea}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{entrada.vehiculo?.descripcion || 'Motor sin descripción'}{entrada.vehiculo?.numeroMotor ? ` · ${entrada.vehiculo.numeroMotor}` : ''}{entrada.vehiculo?.patente ? ` · ${entrada.vehiculo.patente}` : ''}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{new Date(entrada.fecha).toLocaleString('es-AR')}</div>
            {entrada.comentario ? <p className="mt-3 rounded-md bg-secondary/40 p-3 text-sm text-muted-foreground">{entrada.comentario}</p> : null}
            {!finalizada && entrada.estadoActual !== 'PENDIENTE' ? <p className="mt-2 text-xs text-muted-foreground">Estado actual: {entrada.estadoActual === 'FINALIZADA' ? 'finalizada posteriormente' : entrada.estadoActual.toLowerCase().replace('_', ' ')}</p> : null}
          </div>
          {puedeRetomar ? <button disabled={tareaOcupada === entrada.idTarea} onClick={() => void retomar(entrada)} className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm disabled:opacity-50"><RotateCcw className="h-4 w-4" />Retomar</button> : null}
        </div>
      </article>;
    })}</div>
  </div></main>;
}
