import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Users as UsersIcon, Edit, Trash2, Car, Phone, Mail, MapPin, TrendingUp } from 'lucide-react';
import { Client, getClients, saveClient, deleteClient } from '../clientStore';
import { getOrders } from '../store';
import { getClientFinancialStats } from '../clientStore';
import { getCurrentUser } from '../auth';

export function ClientList() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const isAdmin = currentUser?.role === 'admin';
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    setClients(getClients().sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        nombre: client.nombre,
        telefono: client.telefono || '',
        email: client.email || '',
        direccion: client.direccion || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({ nombre: '', telefono: '', email: '', direccion: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    const client: Client = {
      id: editingClient?.id || crypto.randomUUID(),
      nombre: formData.nombre,
      telefono: formData.telefono,
      email: formData.email,
      direccion: formData.direccion,
      vehiculos: editingClient?.vehiculos || [],
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    };

    saveClient(client);
    loadClients();
    handleCloseModal();
  };

  const handleDelete = (clientId: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteClient(clientId);
      loadClients();
    }
  };

  const orders = getOrders();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto">
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
                  <UsersIcon className="w-10 h-10 text-primary" />
                  Gestión de Clientes
                </h1>
                <p className="text-muted-foreground mt-1">
                  Base de datos de clientes y vehículos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Clientes</div>
            <div className="text-3xl font-bold font-mono">{clients.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Vehículos</div>
            <div className="text-3xl font-bold font-mono">
              {clients.reduce((sum, c) => sum + c.vehiculos.length, 0)}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Órdenes Totales</div>
            <div className="text-3xl font-bold font-mono">{orders.length}</div>
          </div>
        </div>

        {/* Clients List */}
        <div className="grid grid-cols-1 gap-4">
          {clients.map((client) => {
            const stats = getClientFinancialStats(client.nombre, orders);
            return (
              <div
                key={client.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{client.nombre}</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {client.telefono && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {client.telefono}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                      )}
                      {client.direccion && (
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <MapPin className="w-4 h-4" />
                          {client.direccion}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="p-2 hover:bg-secondary rounded-md transition-colors"
                      title="Editar cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vehicles */}
                {client.vehiculos.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <Car className="w-4 h-4 text-primary" />
                      Vehículos ({client.vehiculos.length})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {client.vehiculos.map((vehicle, idx) => (
                        <div
                          key={idx}
                          className="bg-secondary/30 rounded-md p-3 text-sm"
                        >
                          <div className="font-semibold">{vehicle.motor}</div>
                          {vehicle.numeroMotor && (
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              N° {vehicle.numeroMotor}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Stats (Solo Admin) */}
                {isAdmin && stats.ordersCount > 0 && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Resumen Financiero
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-secondary/30 rounded-md p-3">
                        <div className="text-xs text-muted-foreground mb-1">Órdenes</div>
                        <div className="text-lg font-mono font-semibold">{stats.ordersCount}</div>
                      </div>
                      <div className="bg-secondary/30 rounded-md p-3">
                        <div className="text-xs text-muted-foreground mb-1">Facturado</div>
                        <div className="text-lg font-mono font-semibold text-primary">
                          ${stats.totalFacturado.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-secondary/30 rounded-md p-3">
                        <div className="text-xs text-muted-foreground mb-1">Pagado</div>
                        <div className="text-lg font-mono font-semibold text-green-400">
                          ${stats.totalPagado.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-secondary/30 rounded-md p-3">
                        <div className="text-xs text-muted-foreground mb-1">Pendiente</div>
                        <div className="text-lg font-mono font-semibold text-yellow-400">
                          ${stats.totalPendiente.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {clients.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <UsersIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No hay clientes registrados</h3>
            <p className="text-muted-foreground">
              Los clientes se crearán automáticamente al generar órdenes de trabajo
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-6">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(011) 1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="cliente@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Dirección</label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                  placeholder="Calle, número, localidad"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-md transition-colors"
                >
                  {editingClient ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
