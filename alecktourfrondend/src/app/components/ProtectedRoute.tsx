import { useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

interface Props {
  children: React.ReactNode;
  requiredRole?: "admin" | "empleado";
  redirectTo?: string;
}

function RequireLogin({ redirectTo }: { redirectTo: string }) {
  const { openLogin } = useAuthModal();

  useEffect(() => {
    openLogin();
  }, []);

  return <Navigate to={redirectTo} replace />;
}

export default function ProtectedRoute({ children, requiredRole, redirectTo = "/" }: Props) {
  const { isAuthenticated, isAdmin, isEmpleado, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // No autenticado → home + abre el modal de login
  if (!isAuthenticated) return <RequireLogin redirectTo="/" />;

  // Ruta exclusiva admin
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  // Ruta exclusiva empleado
  if (requiredRole === "empleado" && !isEmpleado && !isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si es admin intentando entrar a una ruta de cliente → mandarlo a /admin
  if (!requiredRole && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}