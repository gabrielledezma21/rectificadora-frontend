import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, ListChecks, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { eliminarTareaApi, guardarTareaApi, listarTareas, restaurarTareaApi, type TareaCatalogo } from '../serviciosApi';

const etiquetas = { BLOCK: 'Block', REPUESTO: 'Repuesto', TAPA: 'Tapa', CIGUENAL: 'Cigüeñal', OTRO: 'Otro' } as const;
const vacia: TareaCatalogo = { id: '', name: '', category: 'OTRO', price: 0, active: true };

export function CatalogManagement() {
  const navigate = useNavigate();
  const [tareas, setTareas] = useState<TareaCatalogo[]>([]);
  const [editing, setEditing] = useState<TareaCatalogo | null>(null);
  const [error, setError] = useState('');
  const cargar = async () => { try { setTareas(await listarTareas(true)); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo'); } };
  useEffect(() => {
    // La actualización ocurre después de resolver la consulta remota.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, []);

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editing) return;
    try { await guardarTareaApi(editing); await cargar(); setEditing(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar la tarea'); }
  };
  const cambiarDisponibilidad = async (tarea: TareaCatalogo) => {
    try {
      if (tarea.active) {
        if (!window.confirm(`¿Quitar “${tarea.name}” de las órdenes nuevas?`)) return;
        await eliminarTareaApi(tarea.id);
      } else await restaurarTareaApi(tarea.id);
      await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar la tarea'); }
  };

  return <main className="min-h-screen bg-background p-6"><div className="max-w-5xl mx-auto">
    <header className="flex items-center justify-between gap-4 mb-8"><div className="flex items-center gap-4"><button onClick={() => navigate('/')} className="p-2 hover:bg-secondary rounded-md" aria-label="Volver"><ArrowLeft className="w-5 h-5" /></button><div><h1 className="text-4xl font-semibold flex items-center gap-3"><ListChecks className="w-9 h-9 text-primary" />Catálogo de trabajos</h1><p className="text-muted-foreground mt-1">Precios y tareas disponibles para las órdenes</p></div></div><button onClick={() => setEditing(vacia)} className="px-5 py-3 bg-primary rounded-md flex items-center gap-2"><Plus className="w-5 h-5" />Nueva tarea</button></header>
    {error && <div className="mb-5 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">{error}</div>}
    <div className="bg-card border border-border rounded-xl overflow-x-auto"><table className="w-full min-w-[720px]"><thead className="bg-secondary/50"><tr>{['Trabajo','Categoría','Precio','Estado','Acciones'].map(h => <th key={h} className="text-left px-5 py-4 text-sm">{h}</th>)}</tr></thead><tbody>{tareas.map(t => <tr key={t.id} className="border-t border-border"><td className="px-5 py-4 font-medium">{t.name}</td><td className="px-5 py-4 text-sm">{etiquetas[t.category]}</td><td className="px-5 py-4 font-mono">{new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(t.price)}</td><td className="px-5 py-4"><span className={`text-xs px-2 py-1 rounded ${t.active?'bg-green-500/15 text-green-400':'bg-secondary text-muted-foreground'}`}>{t.active?'Activo':'Inactivo'}</span></td><td className="px-5 py-4"><div className="flex gap-1"><button onClick={() => setEditing(t)} className="p-2 hover:bg-secondary rounded-md" aria-label={`Editar ${t.name}`}><Edit className="w-4 h-4" /></button><button onClick={() => void cambiarDisponibilidad(t)} className={`p-2 rounded-md ${t.active ? 'text-destructive hover:bg-destructive/10' : 'text-green-400 hover:bg-green-500/10'}`} aria-label={t.active ? `Eliminar ${t.name}` : `Restaurar ${t.name}`}>{t.active ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}</button></div></td></tr>)}</tbody></table></div>
    {editing && <div className="fixed inset-0 bg-black/70 z-50 grid place-items-center p-4"><form onSubmit={guardar} className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4"><h2 className="text-xl font-semibold">{editing.id?'Editar tarea':'Nueva tarea'}</h2><label className="block text-sm">Nombre<input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} required className="mt-2 w-full bg-input border border-border rounded-md px-4 py-3" /></label><label className="block text-sm">Categoría<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value as TareaCatalogo['category']})} className="mt-2 w-full bg-input border border-border rounded-md px-4 py-3">{Object.entries(etiquetas).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm">Precio<input type="number" min="0" step="0.01" value={editing.price} onChange={e=>setEditing({...editing,price:Number(e.target.value)})} required className="mt-2 w-full bg-input border border-border rounded-md px-4 py-3" /></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={editing.active} onChange={e=>setEditing({...editing,active:e.target.checked})} />Disponible para nuevas órdenes</label><div className="flex gap-3 pt-3"><button type="button" onClick={()=>setEditing(null)} className="flex-1 bg-secondary rounded-md py-3">Cancelar</button><button type="submit" className="flex-1 bg-primary rounded-md py-3">Guardar</button></div></form></div>}
  </div></main>;
}
