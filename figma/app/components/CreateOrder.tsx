import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Save, Printer, Wrench, Calculator, ChevronDown } from 'lucide-react';
import { WorkOrder, TRABAJOS_BLOCK, REPUESTOS, TRABAJOS_TAPA, TRABAJOS_CIGUENAL } from '../types';
import { persistirOrden, generateOrderNumber, cargarOrden } from '../store';
import { cargarClientes, asegurarCliente, Client, Vehicle } from '../clientStore';
import { apiConfigurada } from '../api';
import { listarTareas } from '../serviciosApi';

const ETIQUETA_ESTADO_ORDEN: Record<WorkOrder['estado'], string> = {
  recepcion: 'Recepción',
  'en-proceso': 'En proceso',
  finalizado: 'Finalizada',
  entregado: 'Entregada',
  cancelado: 'Cancelada',
};

const CLASE_ESTADO_ORDEN: Record<WorkOrder['estado'], string> = {
  recepcion: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  'en-proceso': 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  finalizado: 'border-green-500/30 bg-green-500/10 text-green-300',
  entregado: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  cancelado: 'border-red-500/30 bg-red-500/10 text-red-300',
};

const SIGUIENTE_PASO_ESTADO_ORDEN: Record<WorkOrder['estado'], string> = {
  recepcion: 'El siguiente paso es pasarla a En proceso cuando el taller comience el trabajo.',
  'en-proceso': 'Cuando todas las tareas estén terminadas, revisá la orden antes de marcarla como Finalizada.',
  finalizado: 'La orden ya fue revisada. El siguiente paso es marcarla como Entregada cuando el cliente la retire.',
  entregado: 'La orden ya fue entregada. Este estado es final.',
  cancelado: 'La orden está cancelada. Este estado es final.',
};

export function CreateOrder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
  const [showVehicleSuggestions, setShowVehicleSuggestions] = useState(false);
  const [selectedClientVehicles, setSelectedClientVehicles] = useState<Vehicle[]>([]);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [catalogos, setCatalogos] = useState(() => ({ block: TRABAJOS_BLOCK, repuestos: REPUESTOS, tapa: TRABAJOS_TAPA, ciguenal: TRABAJOS_CIGUENAL }));

  const [formData, setFormData] = useState<WorkOrder>({
    id: id || crypto.randomUUID(),
    orderNumber: apiConfigurada ? '' : generateOrderNumber(),
    date: new Date().toISOString().split('T')[0],
    cliente: '',
    motor: '',
    numeroMotor: '',
    cantidadCilindros: 4,
    medidaFinal: '',
    notas: '',
    estado: 'recepcion',
    total: 0,
    sena: 0,
    saldo: 0,
    trabajosBlock: [],
    repuestos: [],
    trabajosTapa: [],
    trabajosCiguenal: [],
    descripcionRecepcion: '',
    payments: [],
    metodoPago: undefined,
    observacionesPago: '',
  });

  useEffect(() => {
    if (isEditing && id) {
      cargarOrden(id).then(async order => {
        if (!order) return;
        setFormData(order);
        const client = (await cargarClientes(order.cliente)).find(c => c.id === order.clientId);
        if (client) setSelectedClientVehicles(client.vehiculos);
      }).catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar la orden'));
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (!apiConfigurada) return;
    listarTareas().then(tareas => setCatalogos({
      block: tareas.filter(t => t.category === 'BLOCK').map(t => ({ name: t.name, price: Number(t.price) })),
      repuestos: tareas.filter(t => t.category === 'REPUESTO').map(t => ({ name: t.name, price: Number(t.price) })),
      tapa: tareas.filter(t => t.category === 'TAPA').map(t => ({ name: t.name, price: Number(t.price) })),
      ciguenal: tareas.filter(t => t.category === 'CIGUENAL').map(t => ({ name: t.name, price: Number(t.price) })),
    })).catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo'));
  }, []);

  const totalCalculado = useMemo(() => {
    const grupos = [
      [formData.trabajosBlock, catalogos.block], [formData.repuestos, catalogos.repuestos],
      [formData.trabajosTapa, catalogos.tapa], [formData.trabajosCiguenal, catalogos.ciguenal],
    ] as const;
    return grupos.reduce((total, [seleccionados, catalogo]) => total + seleccionados.reduce((subtotal, nombre) => subtotal + (catalogo.find(t => t.name === nombre)?.price || 0), 0), 0);
  }, [formData.trabajosBlock, formData.repuestos, formData.trabajosTapa, formData.trabajosCiguenal, catalogos]);
  const saldoCalculado = totalCalculado - formData.sena;

  const handleToggle = (field: 'trabajosBlock' | 'repuestos' | 'trabajosTapa' | 'trabajosCiguenal', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleClientChange = async (value: string) => {
    setFormData({ ...formData, cliente: value, clientId: undefined, vehicleId: undefined });

    if (value.length >= 2) {
      const suggestions = await cargarClientes(value).catch(() => []);
      setClientSuggestions(suggestions);
      setShowClientSuggestions(suggestions.length > 0);
    } else {
      setShowClientSuggestions(false);
      setClientSuggestions([]);
    }
  };

  const handleSelectClient = (client: Client) => {
    setFormData({ ...formData, cliente: client.nombre, clientId: client.id, vehicleId: undefined, motor: '', numeroMotor: '' });
    setShowClientSuggestions(false);
    setSelectedClientVehicles(client.vehiculos);
    setShowVehicleSuggestions(client.vehiculos.length > 0);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setFormData({
      ...formData,
      vehicleId: vehicle.id,
      motor: vehicle.motor,
      numeroMotor: vehicle.numeroMotor || '',
      patente: vehicle.patente || ''
    });
    setShowVehicleSuggestions(false);
  };

  const guardar = async (imprimir: boolean) => {
    if (!formData.cliente || !formData.motor) {
      alert('Por favor complete los datos del cliente y motor');
      return;
    }

    setSaving(true); setError('');
    try {
      const asociado = await asegurarCliente(formData.cliente.trim(), formData.motor.trim(), formData.numeroMotor.trim() || undefined, formData.patente?.trim() || undefined, formData.clientId, formData.vehicleId);
      const guardada = await persistirOrden({ ...formData, total: totalCalculado, saldo: saldoCalculado, clientId: asociado.client.id, vehicleId: asociado.vehicle.id });
      navigate(imprimir ? `/orden/${guardada.id}` : '/');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar la orden'); }
    finally { setSaving(false); }
  };

  const handleSave = () => void guardar(false);
  const handlePrint = () => void guardar(true);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto">
        {error && <div className="mb-5 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">{error}</div>}
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-secondary rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
                <Wrench className="w-8 h-8 text-primary" />
                {isEditing ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
              </h1>
              <p className="text-muted-foreground mt-1">Taller de Rectificación de Motores</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={handlePrint}
              disabled={saving}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Generar Orden
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[400px_1fr] gap-6">
          {/* Sidebar - Client Info */}
          <div className="space-y-6">
            {/* Order Info Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-4 pb-4 border-b border-border">
                <div className="text-sm text-muted-foreground">Número de Orden</div>
                <div className="text-2xl font-mono font-semibold text-primary mt-1">
                  {formData.orderNumber || 'Se asigna al guardar'}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">Estado actual</div>
                  <div className="rounded-lg border border-border bg-background/40 p-4">
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-sm font-semibold ${CLASE_ESTADO_ORDEN[formData.estado]}`}>
                      {ETIQUETA_ESTADO_ORDEN[formData.estado]}
                    </span>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {isEditing
                        ? SIGUIENTE_PASO_ESTADO_ORDEN[formData.estado]
                        : 'Las órdenes nuevas comienzan en Recepción. El estado se avanza después desde la vista administrativa.'}
                    </p>
                    {isEditing && apiConfigurada ? <button
                      type="button"
                      onClick={() => navigate(`/orden/${formData.id}?format=administrativa`)}
                      className="mt-3 flex w-full items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm hover:bg-secondary/80"
                    >
                      Gestionar estado
                      <ArrowRight className="h-4 w-4" />
                    </button> : null}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
                <div><label className="block text-sm text-muted-foreground mb-2">Entrega estimada</label><input type="date" value={formData.fechaPrometida || ''} onChange={(e) => setFormData({ ...formData, fechaPrometida: e.target.value })} className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono" /></div>
              </div>
            </div>

            {/* Client Data Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Datos del Cliente</h3>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm text-muted-foreground mb-2">Cliente *</label>
                  <input
                    ref={clientInputRef}
                    type="text"
                    value={formData.cliente}
                    onChange={(e) => handleClientChange(e.target.value)}
                    onFocus={() => {
                      if (clientSuggestions.length > 0) {
                        setShowClientSuggestions(true);
                      }
                    }}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nombre del cliente"
                  />
                  {showClientSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {clientSuggestions.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="font-semibold">{client.nombre}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {client.vehiculos.length} vehículo{client.vehiculos.length !== 1 ? 's' : ''} registrado{client.vehiculos.length !== 1 ? 's' : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm text-muted-foreground mb-2">Motor / Modelo *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.motor}
                      onChange={(e) => setFormData({ ...formData, motor: e.target.value })}
                      onFocus={() => {
                        if (selectedClientVehicles.length > 0) {
                          setShowVehicleSuggestions(true);
                        }
                      }}
                      className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ej: Ford 1.6 Rocam"
                    />
                    {selectedClientVehicles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowVehicleSuggestions(!showVehicleSuggestions)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {showVehicleSuggestions && selectedClientVehicles.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {selectedClientVehicles.map((vehicle, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectVehicle(vehicle)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="font-semibold">{vehicle.motor}</div>
                          {vehicle.numeroMotor && (
                            <div className="text-xs text-muted-foreground mt-1 font-mono">
                              N° {vehicle.numeroMotor}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Número de Motor</label>
                  <input
                    type="text"
                    value={formData.numeroMotor}
                    onChange={(e) => setFormData({ ...formData, numeroMotor: e.target.value })}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    placeholder="Número de serie"
                  />
                </div>
                <div><label className="block text-sm text-muted-foreground mb-2">Patente</label><input type="text" value={formData.patente || ''} onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })} className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono" placeholder="AA 123 BB" /></div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Cantidad de Cilindros</label>
                  <input
                    type="number"
                    value={formData.cantidadCilindros}
                    onChange={(e) => setFormData({ ...formData, cantidadCilindros: parseInt(e.target.value) || 0 })}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    min="1"
                    max="12"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Medida Final</label>
                  <input
                    type="text"
                    value={formData.medidaFinal}
                    onChange={(e) => setFormData({ ...formData, medidaFinal: e.target.value })}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    placeholder="Ej: 0.50mm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="Observaciones generales"
                  />
                </div>
              </div>
            </div>

            {/* Financial Info Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Información Financiera
              </h3>
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Total Calculado</div>
                  <div className="text-2xl font-mono font-semibold text-primary">
                    ${totalCalculado.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Basado en tareas seleccionadas
                  </div>
                </div>

                {!apiConfigurada ? <div>
                  <label className="block text-sm text-muted-foreground mb-2">Seña</label>
                  <input
                    type="number"
                    value={formData.sena > 0 ? formData.sena : ""}
                    onChange={(e) => setFormData({ ...formData, sena: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div> : <p className="text-xs text-muted-foreground">La seña se registra desde la lista de órdenes después de guardar, para que quede asentada como pago.</p>}

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Saldo Pendiente</span>
                    <span className="text-xl font-mono font-semibold text-primary">
                      ${saldoCalculado.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info Card */}
            {!apiConfigurada && <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Información de Pago</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Método de Pago</label>
                  <select
                    value={formData.metodoPago || ''}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as WorkOrder['metodoPago'] })}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="cheque">Cheque</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Observaciones de Pago
                  </label>
                  <textarea
                    value={formData.observacionesPago}
                    onChange={(e) => setFormData({ ...formData, observacionesPago: e.target.value })}
                    className="w-full bg-input px-3 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    placeholder="Ej: Pago en 3 cuotas, acordado de palabra, etc."
                  />
                </div>
              </div>
            </div>}
          </div>

          {/* Main Content - Work Sections */}
          <div className="space-y-6">
            {/* Block Section */}
            <div className="bg-card border-l-4 border-l-[#2563eb] rounded-lg overflow-hidden">
              <div className="bg-[#2563eb]/10 px-6 py-4 border-b border-border">
                <h2 className="text-xl font-semibold text-[#2563eb]">Trabajos del Block</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-3">
                {catalogos.block.map((task) => (
                  <label
                    key={task.name}
                    className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 p-3 rounded-md transition-colors group border border-transparent hover:border-[#2563eb]/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.trabajosBlock.includes(task.name)}
                        onChange={() => handleToggle('trabajosBlock', task.name)}
                        className="w-5 h-5 rounded border-2 border-border bg-input checked:bg-[#2563eb] checked:border-[#2563eb] cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-foreground transition-colors">{task.name}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-[#2563eb]">
                      ${task.price.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Repuestos Section */}
            <div className="bg-card border-l-4 border-l-[#f97316] rounded-lg overflow-hidden">
              <div className="bg-[#f97316]/10 px-6 py-4 border-b border-border">
                <h2 className="text-xl font-semibold text-[#f97316]">Repuestos</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-3">
                {catalogos.repuestos.map((task) => (
                  <label
                    key={task.name}
                    className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 p-3 rounded-md transition-colors group border border-transparent hover:border-[#f97316]/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.repuestos.includes(task.name)}
                        onChange={() => handleToggle('repuestos', task.name)}
                        className="w-5 h-5 rounded border-2 border-border bg-input checked:bg-[#f97316] checked:border-[#f97316] cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-foreground transition-colors">{task.name}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-[#f97316]">
                      ${task.price.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tapa Section */}
            <div className="bg-card border-l-4 border-l-[#10b981] rounded-lg overflow-hidden">
              <div className="bg-[#10b981]/10 px-6 py-4 border-b border-border">
                <h2 className="text-xl font-semibold text-[#10b981]">Trabajos de Tapa</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-3">
                {catalogos.tapa.map((task) => (
                  <label
                    key={task.name}
                    className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 p-3 rounded-md transition-colors group border border-transparent hover:border-[#10b981]/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.trabajosTapa.includes(task.name)}
                        onChange={() => handleToggle('trabajosTapa', task.name)}
                        className="w-5 h-5 rounded border-2 border-border bg-input checked:bg-[#10b981] checked:border-[#10b981] cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-foreground transition-colors">{task.name}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-[#10b981]">
                      ${task.price.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cigüeñal Section */}
            <div className="bg-card border-l-4 border-l-[#8b5cf6] rounded-lg overflow-hidden">
              <div className="bg-[#8b5cf6]/10 px-6 py-4 border-b border-border">
                <h2 className="text-xl font-semibold text-[#8b5cf6]">Trabajos de Cigüeñal</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-3">
                {catalogos.ciguenal.map((task) => (
                  <label
                    key={task.name}
                    className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 p-3 rounded-md transition-colors group border border-transparent hover:border-[#8b5cf6]/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.trabajosCiguenal.includes(task.name)}
                        onChange={() => handleToggle('trabajosCiguenal', task.name)}
                        className="w-5 h-5 rounded border-2 border-border bg-input checked:bg-[#8b5cf6] checked:border-[#8b5cf6] cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-foreground transition-colors">{task.name}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-[#8b5cf6]">
                      ${task.price.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reception Description */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="block text-sm text-muted-foreground mb-3">Descripción de Recepción</label>
              <textarea
                value={formData.descripcionRecepcion}
                onChange={(e) => setFormData({ ...formData, descripcionRecepcion: e.target.value })}
                className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
                placeholder="Detalle del estado del motor al momento de la recepción..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
