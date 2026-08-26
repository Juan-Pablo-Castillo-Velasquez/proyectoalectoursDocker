import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface Usuario {
  username: string;
  user_id?: number;
  id_cliente?: number;
  roles?: string[];
  foto_perfil?: string | null;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  updateUsuario: (partial: Partial<Usuario>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmpleado: boolean;
  authLoading: boolean; // ← nuevo: true mientras lee localStorage
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // ← empieza en true

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("usuario");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUsuario(JSON.parse(savedUser));
      } catch {
        // JSON inválido — limpiar
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }
    }
    setAuthLoading(false); // ← ya terminó de leer
  }, []);

  useEffect(() => {
    // apiFetch dispara esto cuando un endpoint protegido responde 401
    // (token expirado/inválido) — sincroniza el estado de React con el storage.
    function handleSessionExpired() {
      setToken(null);
      setUsuario(null);
    }
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  function login(newToken: string, newUsuario: Usuario) {
    const savedUser = localStorage.getItem("usuario");
    const idClienteExistente = savedUser
      ? JSON.parse(savedUser).id_cliente
      : undefined;

    const usuarioFinal: Usuario = {
      ...newUsuario,
      id_cliente: newUsuario.id_cliente ?? idClienteExistente,
    };

    setToken(newToken);
    setUsuario(usuarioFinal);
    localStorage.setItem("token", newToken);
    localStorage.setItem("usuario", JSON.stringify(usuarioFinal));
  }

  function updateUsuario(partial: Partial<Usuario>) {
    setUsuario((prev) => {
      if (!prev) return prev;
      const actualizado = { ...prev, ...partial };
      localStorage.setItem("usuario", JSON.stringify(actualizado));
      return actualizado;
    });
  }

  function logout() {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    sessionStorage.removeItem("id_cliente_pendiente");
  }

  const isAdmin = usuario?.roles?.includes("admin") ?? false;
  const isEmpleado = usuario?.roles?.includes("empleado") ?? false;

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        updateUsuario,
        isAuthenticated: !!token,
        isAdmin,
        isEmpleado,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
