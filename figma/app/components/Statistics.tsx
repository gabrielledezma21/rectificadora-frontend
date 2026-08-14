import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Calendar, TrendingUp, Wrench, DollarSign } from 'lucide-react';
import { WorkOrder } from '../types';
import { cargarOrdenes } from '../store';

export function Statistics() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    receptionOrders: 0,
    totalRevenue: 0,
    totalPending: 0,
    totalCollected: 0,
    trabajosBlock: {} as Record<string, number>,
    repuestos: {} as Record<string, number>,
    trabajosTapa: {} as Record<string, number>,
    trabajosCiguenal: {} as Record<string, number>,
    paymentMethods: {} as Record<string, number>,
  });

  const [error, setError] = useState('');
  async function calculateStats() {
    let allOrders: WorkOrder[];
    try { allOrders = await cargarOrdenes(); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar las estadísticas'); return; }
    const [year, month] = selectedMonth.split('-').map(Number);

    const monthOrders = allOrders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.getFullYear() === year && orderDate.getMonth() + 1 === month;
    });

    const trabajosBlock: Record<string, number> = {};
    const repuestos: Record<string, number> = {};
    const trabajosTapa: Record<string, number> = {};
    const trabajosCiguenal: Record<string, number> = {};
    const paymentMethods: Record<string, number> = {};

    let totalRevenue = 0;
    let totalCollected = 0;

    monthOrders.forEach(order => {
      totalRevenue += order.total;
      totalCollected += order.sena;

      order.trabajosBlock.forEach(trabajo => {
        trabajosBlock[trabajo] = (trabajosBlock[trabajo] || 0) + 1;
      });

      order.repuestos.forEach(repuesto => {
        repuestos[repuesto] = (repuestos[repuesto] || 0) + 1;
      });

      order.trabajosTapa.forEach(trabajo => {
        trabajosTapa[trabajo] = (trabajosTapa[trabajo] || 0) + 1;
      });

      if (order.trabajosCiguenal) {
        order.trabajosCiguenal.forEach(trabajo => {
          trabajosCiguenal[trabajo] = (trabajosCiguenal[trabajo] || 0) + 1;
        });
      }

      if (order.payments) {
        order.payments.forEach(payment => {
          const paymentDate = new Date(payment.date);
          if (paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month) {
            paymentMethods[payment.method] = (paymentMethods[payment.method] || 0) + payment.amount;
          }
        });
      }
    });

    setStats({
      totalOrders: monthOrders.length,
      completedOrders: monthOrders.filter(o => o.estado === 'finalizado').length,
      inProgressOrders: monthOrders.filter(o => o.estado === 'en-proceso').length,
      receptionOrders: monthOrders.filter(o => o.estado === 'recepcion').length,
      totalRevenue,
      totalPending: totalRevenue - totalCollected,
      totalCollected,
      trabajosBlock,
      repuestos,
      trabajosTapa,
      trabajosCiguenal,
      paymentMethods,
    });
  }

  useEffect(() => {
    // La actualización ocurre después de resolver la consulta remota.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void calculateStats();
    // La función usa únicamente el mes seleccionado y los datos remotos actuales.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const getTopItems = (items: Record<string, number>, limit = 5) => {
    return Object.entries(items)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  };

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    otro: 'Otro',
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto">
        {error && <div className="mb-5 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">{error}</div>}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-secondary rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3">
                  <TrendingUp className="w-10 h-10 text-primary" />
                  Estadísticas Mensuales
                </h1>
                <p className="text-muted-foreground mt-1">
                  Análisis de trabajos y rendimiento del taller
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-card border border-border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Órdenes</div>
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold font-mono">{stats.totalOrders}</div>
          </div>

          <div className="bg-card border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-green-400">Finalizados</div>
              <div className="text-2xl font-mono text-green-400">{stats.completedOrders}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.totalOrders > 0
                ? `${((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}% del total`
                : '0%'}
            </div>
          </div>

          <div className="bg-card border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-blue-400">En Proceso</div>
              <div className="text-2xl font-mono text-blue-400">{stats.inProgressOrders}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.totalOrders > 0
                ? `${((stats.inProgressOrders / stats.totalOrders) * 100).toFixed(1)}% del total`
                : '0%'}
            </div>
          </div>

          <div className="bg-card border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-yellow-400">Recepción</div>
              <div className="text-2xl font-mono text-yellow-400">{stats.receptionOrders}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.totalOrders > 0
                ? `${((stats.receptionOrders / stats.totalOrders) * 100).toFixed(1)}% del total`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <div className="text-sm text-muted-foreground">Facturación Total</div>
            </div>
            <div className="text-3xl font-bold font-mono text-primary">
              ${stats.totalRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-card border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div className="text-sm text-green-400">Cobrado</div>
            </div>
            <div className="text-3xl font-bold font-mono text-green-400">
              ${stats.totalCollected.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.totalRevenue > 0
                ? `${((stats.totalCollected / stats.totalRevenue) * 100).toFixed(1)}% del total`
                : '0%'}
            </div>
          </div>

          <div className="bg-card border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <div className="text-sm text-yellow-400">Pendiente</div>
            </div>
            <div className="text-3xl font-bold font-mono text-yellow-400">
              ${stats.totalPending.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.totalRevenue > 0
                ? `${((stats.totalPending / stats.totalRevenue) * 100).toFixed(1)}% del total`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        {Object.keys(stats.paymentMethods).length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Métodos de Pago</h2>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(stats.paymentMethods).map(([method, amount]) => (
                <div key={method} className="bg-secondary/30 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    {PAYMENT_METHOD_LABELS[method] || method}
                  </div>
                  <div className="text-xl font-mono font-semibold">${amount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.totalCollected > 0
                      ? `${((amount / stats.totalCollected) * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Statistics */}
        <div className="grid grid-cols-2 gap-6">
          {/* Block */}
          {Object.keys(stats.trabajosBlock).length > 0 && (
            <div className="bg-card border-l-4 border-l-[#2563eb] rounded-lg overflow-hidden">
              <div className="bg-[#2563eb]/10 px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-[#2563eb]">
                  Trabajos del Block Más Realizados
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {getTopItems(stats.trabajosBlock).map(([trabajo, count]) => (
                  <div key={trabajo} className="flex items-center justify-between">
                    <span className="text-sm">{trabajo}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563eb]"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.trabajosBlock))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repuestos */}
          {Object.keys(stats.repuestos).length > 0 && (
            <div className="bg-card border-l-4 border-l-[#f97316] rounded-lg overflow-hidden">
              <div className="bg-[#f97316]/10 px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-[#f97316]">
                  Repuestos Más Solicitados
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {getTopItems(stats.repuestos).map(([repuesto, count]) => (
                  <div key={repuesto} className="flex items-center justify-between">
                    <span className="text-sm">{repuesto}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#f97316]"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.repuestos))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tapa */}
          {Object.keys(stats.trabajosTapa).length > 0 && (
            <div className="bg-card border-l-4 border-l-[#10b981] rounded-lg overflow-hidden">
              <div className="bg-[#10b981]/10 px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-[#10b981]">
                  Trabajos de Tapa Más Realizados
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {getTopItems(stats.trabajosTapa).map(([trabajo, count]) => (
                  <div key={trabajo} className="flex items-center justify-between">
                    <span className="text-sm">{trabajo}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10b981]"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.trabajosTapa))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cigüeñal */}
          {Object.keys(stats.trabajosCiguenal).length > 0 && (
            <div className="bg-card border-l-4 border-l-[#8b5cf6] rounded-lg overflow-hidden">
              <div className="bg-[#8b5cf6]/10 px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-[#8b5cf6]">
                  Trabajos de Cigüeñal Más Realizados
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {getTopItems(stats.trabajosCiguenal).map(([trabajo, count]) => (
                  <div key={trabajo} className="flex items-center justify-between">
                    <span className="text-sm">{trabajo}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8b5cf6]"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.trabajosCiguenal))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {stats.totalOrders === 0 && (
          <div className="bg-card border border-border rounded-lg p-12 text-center mt-6">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No hay datos para este mes</h3>
            <p className="text-muted-foreground">
              Selecciona otro mes para ver las estadísticas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
