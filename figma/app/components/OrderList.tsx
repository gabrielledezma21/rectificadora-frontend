import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Eye, Edit, Wrench, Filter, DollarSign, CheckCircle2, BarChart3, Users, Shield } from 'lucide-react';
import { WorkOrder } from '../types';
import { cargarOrdenes, registrarPago } from '../store';
import { getCurrentUser } from '../auth';

const ESTADO_COLORS = {
  recepcion: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'en-proceso': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  finalizado: 'bg-green-500/20 text-green-400 border-green-500/30',
  entregado: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const ESTADO_LABELS = {
  recepcion: 'Recepción',
  'en-proceso': 'En Proceso',
  finalizado: 'Finalizado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export function OrderList() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const isAdmin = currentUser?.role === 'admin';
  const canPay = isAdmin || Boolean(currentUser?.permissions?.includes('PAGOS_REGISTRAR'));
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [paymentModal, setPaymentModal] = useState<{ show: boolean; order: WorkOrder | null }>({
    show: false,
    order: null,
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro'>('efectivo');
  const [paymentDetails, setPaymentDetails] = useState('');

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrders() {
    setLoading(true); setError('');
    try {
    let loadedOrders = await cargarOrdenes();

    // Si es usuario (no admin), filtrar solo órdenes del mes actual
    if (!isAdmin) {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      loadedOrders = loadedOrders.filter(order => {
        const orderDate = new Date(order.date);
        const current = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        const stillOpen = order.estado === 'recepcion' || order.estado === 'en-proceso' || order.estado === 'finalizado';
        return current || stillOpen;
      });
    }

    loadedOrders = loadedOrders.toSorted((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setOrders(loadedOrders);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar las órdenes'); }
    finally { setLoading(false); }
  }

  const handleOpenPayment = (order: WorkOrder) => {
    setPaymentModal({ show: true, order });
    setPaymentAmount(order.saldo.toString());
    setPaymentMethod('efectivo');
    setPaymentDetails('');
  };

  const handleRegisterPayment = async () => {
    if (!paymentModal.order) return;

    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0 || amount > paymentModal.order.saldo) {
      alert('Ingrese un monto válido');
      return;
    }

    try {
      await registrarPago(paymentModal.order, amount, paymentMethod, paymentDetails);
      await loadOrders(); setPaymentModal({ show: false, order: null }); setPaymentAmount(''); setPaymentMethod('efectivo'); setPaymentDetails('');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo registrar el pago'); }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.motor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterEstado === 'all' || order.estado === filterEstado;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto">
        {error && <div className="mb-5 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">{error}</div>}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Wrench className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">
                  Órdenes de Trabajo
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isAdmin
                    ? 'Gestión de trabajos de rectificación'
                    : `Trabajos del mes - ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                    onClick={() => navigate('/clientes')}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Clientes
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => navigate('/usuarios')}
                    className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-5 h-5" />
                    Usuarios
                  </button>
                  <button
                    onClick={() => navigate('/estadisticas')}
                    className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Estadísticas
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/crear')}
                className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
                Nueva Orden
              </button>
            </div>
          </div>

          {/* Info banner for users */}
          {!isAdmin && (
            <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                ℹ️ Como usuario, solo puedes ver las órdenes del mes actual. Los administradores tienen acceso a todo el historial.
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, motor o número de orden..."
                className="w-full bg-card border border-border rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                <option value="recepcion">Recepción</option>
                <option value="en-proceso">En Proceso</option>
                <option value="finalizado">Finalizado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="text-sm text-muted-foreground mb-1">Total Órdenes</div>
            <div className="text-3xl font-bold font-mono">{orders.length}</div>
          </div>
          <div className="bg-card border border-yellow-500/30 rounded-lg p-5">
            <div className="text-sm text-yellow-400 mb-1">Recepción</div>
            <div className="text-3xl font-bold font-mono text-yellow-400">
              {orders.filter(o => o.estado === 'recepcion').length}
            </div>
          </div>
          <div className="bg-card border border-blue-500/30 rounded-lg p-5">
            <div className="text-sm text-blue-400 mb-1">En Proceso</div>
            <div className="text-3xl font-bold font-mono text-blue-400">
              {orders.filter(o => o.estado === 'en-proceso').length}
            </div>
          </div>
          <div className="bg-card border border-green-500/30 rounded-lg p-5">
            <div className="text-sm text-green-400 mb-1">Finalizados</div>
            <div className="text-3xl font-bold font-mono text-green-400">
              {orders.filter(o => o.estado === 'finalizado').length}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {!loading && filteredOrders.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Wrench className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron órdenes</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterEstado !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera orden de trabajo'}
            </p>
            {!searchTerm && filterEstado === 'all' && (
              <button
                onClick={() => navigate('/crear')}
                className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-md transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Primera Orden
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-6 py-4 font-semibold text-sm">Orden</th>
                  <th className="text-left px-6 py-4 font-semibold text-sm">Cliente</th>
                  <th className="text-left px-6 py-4 font-semibold text-sm">Motor</th>
                  <th className="text-left px-6 py-4 font-semibold text-sm">Fecha</th>
                  <th className="text-left px-6 py-4 font-semibold text-sm">Estado</th>
                  <th className="text-right px-6 py-4 font-semibold text-sm">Saldo Pendiente</th>
                  <th className="text-right px-6 py-4 font-semibold text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-semibold text-primary">
                        {order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.cliente}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{order.motor}</div>
                      {order.numeroMotor && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {order.numeroMotor}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono">
                        {new Date(order.date).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${ESTADO_COLORS[order.estado]}`}>
                          {ESTADO_LABELS[order.estado]}
                        </span>
                        {order.saldo === 0 && order.estado === 'finalizado' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Pagado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-mono font-semibold ${order.saldo === 0 ? 'text-green-400' : order.saldo < order.total ? 'text-yellow-400' : 'text-foreground'}`}>
                        ${order.saldo.toFixed(2)}
                      </div>
                      {order.saldo < order.total && order.saldo > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Total: ${order.total.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {canPay && order.saldo > 0 && (
                          <button
                            onClick={() => handleOpenPayment(order)}
                            className="p-2 hover:bg-green-500/10 text-green-400 rounded-md transition-colors"
                            title="Registrar pago"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/orden/${order.id}`)}
                          className="p-2 hover:bg-secondary rounded-md transition-colors"
                          title="Ver orden"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(isAdmin || currentUser?.permissions?.includes('ORDENES_GESTIONAR')) && (
                          <button
                            onClick={() => navigate(`/editar/${order.id}`)}
                            className="p-2 hover:bg-secondary rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal.show && paymentModal.order && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              Registrar Pago
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-secondary/30 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Cliente</div>
                <div className="font-semibold">{paymentModal.order.cliente}</div>
                <div className="text-sm text-muted-foreground mt-2">Orden</div>
                <div className="font-mono font-semibold text-primary">{paymentModal.order.orderNumber}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total</div>
                  <div className="font-mono font-semibold">${paymentModal.order.total.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Saldo Pendiente</div>
                  <div className="font-mono font-semibold text-yellow-400">
                    ${paymentModal.order.saldo.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Monto a Pagar *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-lg"
                  placeholder="0.00"
                  step="0.01"
                  max={paymentModal.order.saldo}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Método de Pago *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as import('../types').Payment['method'])}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="efectivo">Efectivo</option>
                  {isAdmin && <option value="transferencia">Transferencia</option>}
                  {isAdmin && <option value="tarjeta">Tarjeta</option>}
                  {isAdmin && <option value="cheque">Cheque</option>}
                  {isAdmin && <option value="otro">Otro</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Detalles / Observaciones
                </label>
                <textarea
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={2}
                  placeholder="Ej: Acordado de palabra, pago en cuotas, etc."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPaymentModal({ show: false, order: null });
                  setPaymentAmount('');
                  setPaymentMethod('efectivo');
                  setPaymentDetails('');
                }}
                className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterPayment}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
