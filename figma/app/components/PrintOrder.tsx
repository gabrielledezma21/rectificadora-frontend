import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Printer } from 'lucide-react';
import { WorkOrder, TRABAJOS_BLOCK, REPUESTOS, TRABAJOS_TAPA, TRABAJOS_CIGUENAL } from '../types';
import { getOrderById } from '../store';

export function PrintOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    if (id) {
      const foundOrder = getOrderById(id);
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return null;
  }

  const allTasks = [
    ...order.trabajosBlock.map(t => ({ type: 'Block', name: t })),
    ...order.repuestos.map(t => ({ type: 'Repuestos', name: t })),
    ...order.trabajosTapa.map(t => ({ type: 'Tapa', name: t })),
    ...order.trabajosCiguenal.map(t => ({ type: 'Cigüeñal', name: t })),
  ];

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-background p-4 border-b border-border sticky top-0 z-10">
        <div className="max-w-[210mm] mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Print Document */}
      <div className="print:p-0 p-8 bg-muted min-h-screen">
        <div className="max-w-[210mm] mx-auto bg-white text-black p-12 shadow-2xl print:shadow-none">
          {/* Header */}
          <div className="border-b-2 border-black pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                  Rectificadora Las Flores
                </h1>
                <p className="text-sm mt-2 text-gray-700">
                  Rectificación y más
                </p>
                <p className="text-sm text-gray-700">
                  Tel: (011) 3078-5714 | Email: taller@ejemplo.com
                </p>
                <p className="text-sm text-gray-700">
                  Dirección: Av. Del Libertador 6085
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Orden N°</div>
                <div className="text-2xl font-bold font-mono bg-gray-100 px-4 py-2 rounded border-2 border-black">
                  {order.orderNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold uppercase tracking-wider border-2 border-black inline-block px-8 py-3">
              Orden de Reparación
            </h2>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex border-b border-gray-300 pb-2">
                <span className="text-sm font-semibold w-32">Cliente:</span>
                <span className="text-sm flex-1">{order.cliente}</span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="text-sm font-semibold w-32">Motor/Modelo:</span>
                <span className="text-sm flex-1">{order.motor}</span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="text-sm font-semibold w-32">N° Motor:</span>
                <span className="text-sm flex-1 font-mono">{order.numeroMotor || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex border-b border-gray-300 pb-2">
                <span className="text-sm font-semibold w-32">Fecha:</span>
                <span className="text-sm flex-1 font-mono">
                  {new Date(order.date).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="text-sm font-semibold w-32">Cilindros:</span>
                <span className="text-sm flex-1">{order.cantidadCilindros}</span>
              </div>
              <div className="flex border-b border-gray-300 pb-2">
                <span className="text-sm font-semibold w-32">Medida Final:</span>
                <span className="text-sm flex-1 font-mono">{order.medidaFinal || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Reception Description */}
          {order.descripcionRecepcion && (
            <div className="mb-8 border border-gray-300 rounded p-4 bg-gray-50">
              <div className="text-sm font-semibold mb-2 uppercase text-gray-700">
                Descripción de Recepción:
              </div>
              <div className="text-sm whitespace-pre-wrap text-gray-800">
                {order.descripcionRecepcion}
              </div>
            </div>
          )}

          {/* Work Details */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 uppercase border-b-2 border-black pb-2">
              Detalle del Trabajo
            </h3>

            {allTasks.length === 0 ? (
              <p className="text-sm text-gray-600 italic">No se especificaron trabajos</p>
            ) : (
              <div className="space-y-1.5">
                {order.trabajosBlock.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold uppercase text-gray-600 mb-2">
                      Trabajos del Block:
                    </div>
                    {order.trabajosBlock.map((trabajo, idx) => {
                      const task = TRABAJOS_BLOCK.find(t => t.name === trabajo);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-3 py-1 ml-4">
                          <div className="flex items-start gap-3">
                            <div className="w-4 h-4 border-2 border-gray-400 rounded-sm mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{trabajo}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {order.repuestos.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold uppercase text-gray-600 mb-2">
                      Repuestos:
                    </div>
                    {order.repuestos.map((repuesto, idx) => {
                      const task = REPUESTOS.find(t => t.name === repuesto);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-3 py-1 ml-4">
                          <div className="flex items-start gap-3">
                            <div className="w-4 h-4 border-2 border-gray-400 rounded-sm mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{repuesto}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {order.trabajosTapa.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold uppercase text-gray-600 mb-2">
                      Trabajos de Tapa:
                    </div>
                    {order.trabajosTapa.map((trabajo, idx) => {
                      const task = TRABAJOS_TAPA.find(t => t.name === trabajo);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-3 py-1 ml-4">
                          <div className="flex items-start gap-3">
                            <div className="w-4 h-4 border-2 border-gray-400 rounded-sm mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{trabajo}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {order.trabajosCiguenal && order.trabajosCiguenal.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold uppercase text-gray-600 mb-2">
                      Trabajos de Cigüeñal:
                    </div>
                    {order.trabajosCiguenal.map((trabajo, idx) => {
                      const task = TRABAJOS_CIGUENAL.find(t => t.name === trabajo);
                      return (
                        <div key={idx} className="flex items-start justify-between gap-3 py-1 ml-4">
                          <div className="flex items-start gap-3">
                            <div className="w-4 h-4 border-2 border-gray-400 rounded-sm mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{trabajo}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notas && (
            <div className="mb-6 border border-gray-300 rounded p-4 bg-gray-50">
              <div className="text-sm font-semibold mb-2 uppercase text-gray-700">
                Observaciones:
              </div>
              <div className="text-sm whitespace-pre-wrap text-gray-800">
                {order.notas}
              </div>
            </div>
          )}

          {/* Total */}
          <h3 className="text-lg font-bold mb-4 uppercase border-b-2 border-black pb-2">
            </h3>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-gray-400">
            <div>
              <div className="border-t-2 border-black pt-2 text-center">
                <p className="text-sm font-semibold">Firma del Cliente</p>
                <p className="text-xs text-gray-600 mt-1">Aclaración</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-black pt-2 text-center">
                <p className="text-sm font-semibold">Firma del Taller</p>
                <p className="text-xs text-gray-600 mt-1">Aclaración</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
            Este documento certifica la recepción del motor y los trabajos a realizar según lo especificado.
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
}
