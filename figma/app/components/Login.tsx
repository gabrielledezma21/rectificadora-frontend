import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, Wrench, AlertCircle } from 'lucide-react';
import { login, initializeUsers, getCurrentUser } from '../auth';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    initializeUsers();
    // Si ya está autenticado, redirigir al inicio
    const user = getCurrentUser();
    if (user) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = login(email, password);
    if (user) {
      navigate('/');
    } else {
      setError('Email o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
            <Wrench className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Sistema de Gestión
          </h1>
          <p className="text-muted-foreground">
            Taller de Rectificación de Motores
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="usuario@ejemplo.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Ingresar
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Usuario por defecto: <span className="font-mono">admin@taller.com</span>
              <br />
              Contraseña: <span className="font-mono">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
