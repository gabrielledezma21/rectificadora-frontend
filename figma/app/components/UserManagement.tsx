import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Edit, Trash2, Users, Shield, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { getCurrentUser } from '../auth';
import { eliminarUsuarioApi, guardarUsuarioApi, listarUsuarios } from '../serviciosApi';

export function UserManagement() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'usuario' as 'admin' | 'usuario',
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
      return;
    }
    loadUsers();
  }, [navigate, currentUser]);

  async function loadUsers() {
    try { setUsers(await listarUsuarios()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios'); }
  }

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'usuario',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', name: '', role: 'usuario' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      alert('Complete los campos obligatorios');
      return;
    }

    if (!editingUser && !formData.password) {
      alert('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    const user: User = {
      id: editingUser?.id || '',
      email: formData.email,
      password: formData.password || editingUser?.password || '',
      name: formData.name,
      role: formData.role,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
      active: editingUser?.active ?? true,
    };

    try { await guardarUsuarioApi(user); await loadUsers(); handleCloseModal(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar el usuario'); }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario');
      return;
    }

    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try { await eliminarUsuarioApi(userId); await loadUsers(); }
      catch (e) { setError(e instanceof Error ? e.message : 'No se pudo eliminar el usuario'); }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto">
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
                  <Users className="w-10 h-10 text-primary" />
                  Gestión de Usuarios
                </h1>
                <p className="text-muted-foreground mt-1">
                  Administración de accesos y permisos
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-4 font-semibold text-sm">Nombre</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Rol</th>
                <th className="text-left px-6 py-4 font-semibold text-sm">Creado</th>
                <th className="text-right px-6 py-4 font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-primary" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="font-medium">{user.name}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Tú
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'admin'
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-secondary text-foreground border-border'
                      }`}
                    >
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono">
                      {new Date(user.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 hover:bg-secondary rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Roles Info */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-card border border-primary/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Rol Administrador</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Acceso completo al sistema</li>
              <li>• Crear, editar y eliminar órdenes</li>
              <li>• Ver estadísticas completas</li>
              <li>• Gestionar usuarios</li>
              <li>• Registrar pagos</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <UserIcon className="w-6 h-6 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Rol Usuario</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Crear nuevas órdenes de trabajo</li>
              <li>• Ver historial del mes actual</li>
              <li>• Ver detalles de órdenes</li>
              <li>• Imprimir órdenes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-6">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nombre del usuario"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Contraseña {editingUser && '(dejar vacío para mantener)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'admin' | 'usuario' })
                  }
                  className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
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
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
