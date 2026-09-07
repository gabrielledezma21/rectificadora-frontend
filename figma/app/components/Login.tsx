import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, Wrench, AlertCircle } from 'lucide-react';
import { login, initializeUsers, getCurrentUser, iniciarDemostracion } from '../auth';
import { apiConfigurada } from '../api';

const EMAIL_DEMO = 'administrador@taller.local';
const PASSWORD_DEMO = process.env.NEXT_PUBLIC_DEMO_PASSWORD || '';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    initializeUsers();
    // Si ya está autenticado, redirigir al inicio
    const user = getCurrentUser();
    if (user) {
      navigate(user.role === 'empleado' ? '/taller' : '/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const user = await login(email, password);
      if (user) navigate(user.role === 'empleado' ? '/taller' : '/');
      else setError('Email o contraseña incorrectos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const handleDemo = () => {
    iniciarDemostracion();
    navigate('/');
  };

  const completarCredencialesDemo = () => {
    setEmail(EMAIL_DEMO);
    setPassword(PASSWORD_DEMO);
    setError('');
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

          {apiConfigurada ? <>
            {PASSWORD_DEMO && (
              <div className="mb-6 rounded-md border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-semibold mb-1">Credenciales de demostración</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Usá este acceso para recorrer las funciones disponibles en la demo.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <code className="rounded bg-background/70 px-2 py-1 break-all">{EMAIL_DEMO}</code>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Contraseña</span>
                    <code className="rounded bg-background/70 px-2 py-1">{PASSWORD_DEMO}</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={completarCredencialesDemo}
                  className="mt-4 w-full border border-primary/40 text-primary hover:bg-primary/10 px-4 py-2 rounded-md transition-colors text-sm font-medium"
                >
                  Completar automáticamente
                </button>
              </div>
            )}

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
                disabled={cargando}
                className="w-full bg-primary hover:bg-primary/90 px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                {cargando ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          </> : <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Explorá todas las funciones con datos locales de ejemplo. Este acceso no contiene información real del taller.</p>
            <button onClick={handleDemo} className="w-full bg-primary hover:bg-primary/90 px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2"><LogIn className="w-5 h-5" />Ingresar al modo demostración</button>
          </div>}
        </div>
      </div>
    </div>
  );
}
