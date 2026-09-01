import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { favoritoService } from "../services/favorito.service";
import { useAuth } from "./AuthContext";

interface FavoritosContextType {
  idsFavoritos: Set<number>;
  isFavorito: (idHotel: number) => boolean;
  toggleFavorito: (idHotel: number) => Promise<void>;
  loadingIds: Set<number>;
}

const FavoritosContext = createContext<FavoritosContextType | null>(null);

// Un solo fetch de /favoritos/ids compartido por todas las HotelCard
// montadas a la vez (evita N llamadas por N tarjetas en un listado).
export function FavoritosProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, usuario } = useAuth();
  const [idsFavoritos, setIdsFavoritos] = useState<Set<number>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // GET /favoritos/ids exige un cliente real (ver _require_cliente en
    // favorito_route.py) — antes se llamaba para cualquier isAuthenticated,
    // así que un admin/empleado (sin id_cliente) recibía un 403 en cada
    // página del panel, verificado en vivo. Los favoritos son un concepto
    // exclusivo del cliente, así que simplemente no se piden si no hay uno.
    if (!isAuthenticated || !usuario?.id_cliente) {
      setIdsFavoritos(new Set());
      return;
    }
    favoritoService
      .listarIds()
      .then((ids) => setIdsFavoritos(new Set(ids)))
      .catch(() => {
        // Silencioso: si falla, el corazón simplemente arranca "vacío"
        // y el usuario puede reintentar marcando de nuevo.
      });
  }, [isAuthenticated, usuario?.id_cliente]);

  const isFavorito = useCallback(
    (idHotel: number) => idsFavoritos.has(idHotel),
    [idsFavoritos],
  );

  const toggleFavorito = useCallback(
    async (idHotel: number) => {
      if (!isAuthenticated) {
        toast.info("Inicia sesión para guardar hoteles en tus favoritos");
        return;
      }

      setLoadingIds((prev) => new Set(prev).add(idHotel));
      const yaEsFavorito = idsFavoritos.has(idHotel);

      try {
        if (yaEsFavorito) {
          await favoritoService.quitar(idHotel);
          setIdsFavoritos((prev) => {
            const next = new Set(prev);
            next.delete(idHotel);
            return next;
          });
          toast.success("Eliminado de tus favoritos");
        } else {
          await favoritoService.agregar(idHotel);
          setIdsFavoritos((prev) => new Set(prev).add(idHotel));
          toast.success("Guardado en tus favoritos");
        }
      } catch {
        toast.error("No se pudo actualizar tus favoritos. Intenta de nuevo.");
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(idHotel);
          return next;
        });
      }
    },
    [idsFavoritos, isAuthenticated],
  );

  return (
    <FavoritosContext.Provider
      value={{ idsFavoritos, isFavorito, toggleFavorito, loadingIds }}
    >
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error("useFavoritos debe usarse dentro de FavoritosProvider");
  return ctx;
}
