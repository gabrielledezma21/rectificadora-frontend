import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Activity, BarChart3, Database, Home, ListChecks, LogOut, Menu, Shield, User, Users, Wrench, X } from 'lucide-react';
import { getCurrentUser, logout } from '../auth';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // No mostrar el header en la página de login
  if (!user || location.pathname === '/login') return null;

  const navItems = [
    { label: 'Inicio', path: '/', icon: Home },
    { label: 'Órdenes', path: '/ordenes', icon: Wrench },
    { label: 'Clientes', path: '/clientes', icon: Users },
    ...(user.role === 'admin' || user.permissions?.includes('CATALOGO_GESTIONAR') ? [{ label: 'Catálogo', path: '/catalogo', icon: ListChecks }] : []),
    ...(user.role === 'admin' ? [
      { label: 'Estadísticas', path: '/estadisticas', icon: BarChart3 },
      { label: 'Actividad', path: '/actividad', icon: Activity },
      { label: 'Respaldos', path: '/respaldos', icon: Database },
    ] : []),
  ];

  return (
    <div className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 hover:bg-secondary rounded-md" aria-label="Abrir menú">{menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            {user.role === 'admin' ? (
              <Shield className="w-5 h-5 text-primary" />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              user.role === 'admin'
                ? 'bg-primary/20 text-primary'
                : 'bg-secondary text-foreground'
            }`}
          >
            {user.role === 'admin' ? 'Dueño / Administrador' : 'Administrativo'}
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navItems.map(item => <button key={item.path} onClick={() => navigate(item.path)} className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${location.pathname === item.path ? 'bg-primary/15 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}><item.icon className="w-4 h-4" />{item.label}</button>)}
        </nav>

        <button
          onClick={handleLogout}
          className="px-4 py-2 hover:bg-secondary rounded-md transition-colors flex items-center gap-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
      {menuOpen && <nav className="lg:hidden border-t border-border p-3 grid grid-cols-2 gap-2">{navItems.map(item => <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false); }} className={`px-3 py-3 rounded-md text-sm flex items-center gap-2 ${location.pathname === item.path ? 'bg-primary/15 text-primary' : 'bg-secondary/40'}`}><item.icon className="w-4 h-4" />{item.label}</button>)}</nav>}
    </div>
  );
}
