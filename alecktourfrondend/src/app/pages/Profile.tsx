import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Footer from "../components/Footer";
import HalloweenAccentDiscreto from "../components/HalloweenAccentDiscreto";
import Navbar from "../components/Navbar";
import ProfileSidebar from "../components/profile/ProfileSidebar";
import TabCuenta from "../components/profile/TabCuenta";
import TabFavoritos from "../components/profile/TabFavoritos";
import TabMensajes from "../components/profile/TabMensajes";
import TabPreferencias from "../components/profile/TabPreferencias";
import TabReservas from "../components/profile/TabReservas";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../context/TemaContext";
import { ClienteResponse, clienteService } from "../services/cliente.service";
import {
  PreferenciaResponse,
  preferenciasService,
} from "../services/preferencias.service";
import { ReservaResponse, reservaService } from "../services/reserva.service";
import { usuarioService } from "../services/usuario.service";
export default function Profile() {
  const { usuario, logout, isAuthenticated, updateUsuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // El único lugar del perfil donde tiene sentido un acento de temporada:
  // el banner superior es puramente decorativo (identidad de marca), a
  // diferencia de TabCuenta (datos/seguridad de la cuenta) -- ahí nunca
  // se agrega nada de esto, mismo criterio de "lejos de lo transaccional"
  // que ya se aplicó en HotelDetail.tsx/PackageDetail.tsx.
  const { temaActivo } = useTema();
  const esHalloween = temaActivo?.clave === "halloween";
  // Permite que otras pantallas (p.ej. el wizard de /preferences al
  // terminar) vuelvan directo a una pestaña específica en vez de caer
  // siempre en "reservas" — ver PreferencesForm.tsx handleFinish.
  const [activeTab, setActiveTab] = useState(
    () => (location.state as { tab?: string } | null)?.tab ?? "reservas",
  );
  // Deep-link desde la campana de notificaciones (NotificacionesBell) a una
  // reserva puntual — se resincroniza en el efecto de abajo porque, si ya
  // estábamos en /profile, react-router no vuelve a montar el componente y
  // el useState inicial de arriba no se re-ejecutaría solo.
  const [reservaIdInicial, setReservaIdInicial] = useState<number | null>(
    () => (location.state as { reservaId?: number } | null)?.reservaId ?? null,
  );
  // "Hablar de esta reserva" (ReservaCard, dentro de TabReservas) -- lleva
  // al cliente a la pestaña Mensajes con esa reserva ya preseleccionada en
  // el composer. Separado de `reservaIdInicial` (que abre el detalle EN
  // TabReservas) para que no se pisen si el cliente vuelve a esa pestaña.
  const [reservaIdParaMensaje, setReservaIdParaMensaje] = useState<number | null>(null);
  const hablarDeReserva = (idReserva: number) => {
    setReservaIdParaMensaje(idReserva);
    setActiveTab("mensajes");
  };
  const [reservas, setReservas] = useState<ReservaResponse[]>([]);
  const [preferencias, setPreferencias] = useState<PreferenciaResponse | null>(
    null,
  );
  const [clienteData, setClienteData] = useState<ClienteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated]);

  // AuthContext.usuario solo se actualiza al hacer login o al editar algo
  // puntual (ver updateUsuario en TabCuenta.tsx) -- nunca se resincroniza
  // con el backend después de eso. Si un admin cambia verificado/activo
  // (ModuleUsuarios.tsx) mientras el cliente ya tiene sesión abierta, el
  // perfil seguía mostrando el estado viejo indefinidamente. Se refresca
  // una vez al entrar a /profile; si la cuenta fue desactivada mientras
  // tanto, el backend responde 403 (get_current_usuario, deps.py) y eso ya
  // dispara auth:session-expired (api.ts), que cierra la sesión sola.
  useEffect(() => {
    if (!isAuthenticated) return;
    usuarioService
      .getMe()
      .then((datos) => {
        updateUsuario({
          foto_perfil: datos.foto_perfil,
          verificado: datos.verificado,
          activo: datos.activo,
        });
      })
      .catch(() => {
        // Si fue 401/403 por sesión invalidada, auth:session-expired ya se
        // encargó de limpiar el estado -- no hay nada más que hacer aquí.
      });
  }, [isAuthenticated]);

  useEffect(() => {
    const state = location.state as { tab?: string; reservaId?: number } | null;
    if (state?.tab) setActiveTab(state.tab);
    if (state?.reservaId != null) setReservaIdInicial(state.reservaId);
  }, [location.state]);

  useEffect(() => {
    if (!isAuthenticated || !usuario?.id_cliente) {
      setLoading(false);
      return;
    }
    Promise.all([
      reservaService.getByCliente(usuario.id_cliente),
      clienteService.getById(usuario.id_cliente),
      preferenciasService.getByCliente(usuario.id_cliente).catch(() => null),
    ])
      .then(([res, cliente, prefs]) => {
        setReservas(res);
        setClienteData(cliente);
        setPreferencias(prefs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [usuario]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Navbar />

      {/* ── Banner Superior con la identidad Granate Agencia ── */}
      <div className="banner-textured h-40 relative">
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
        {/* Efectos sutiles de fondo para aportar dinamismo visual */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute top-8 left-1/4 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
        {/* Único acento de temporada de esta página. Variante "foto" (no
            telaraña/murciélago/calabaza): esas se dibujan con
            text-primary, que sobre este banner (ya en gradiente
            --primary, ver .banner-textured en theme.css) casi no se
            notaría -- el marco blanco tipo polaroid sí contrasta contra
            cualquier fondo de color. */}
        {esHalloween && (
          <HalloweenAccentDiscreto variante="foto" posicion="bottom-right" tamano="sm" />
        )}
      </div>

      {/* ── Contenedor Principal ── */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Barra Lateral de Usuario */}
          <aside className="lg:col-span-1">
            <ProfileSidebar
              usuario={usuario}
              clienteData={clienteData}
              reservas={reservas}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onLogout={handleLogout}
            />
          </aside>

          {/* Área de Contenido Dinámico */}
          <main className="lg:col-span-3 mt-4 lg:mt-8">
            <AnimatePresence mode="wait">
              {activeTab === "reservas" && (
                <motion.div
                  key="reservas"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabReservas
                    reservas={reservas}
                    loading={loading}
                    clienteData={clienteData}
                    reservaIdInicial={reservaIdInicial}
                    onHablarDeReserva={hablarDeReserva}
                  />
                </motion.div>
              )}
              {activeTab === "favoritos" && (
                <motion.div
                  key="favoritos"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabFavoritos />
                </motion.div>
              )}
              {activeTab === "mensajes" && (
                <motion.div
                  key="mensajes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabMensajes reservas={reservas} reservaIdInicial={reservaIdParaMensaje} />
                </motion.div>
              )}
              {activeTab === "preferencias" && (
                <motion.div
                  key="preferencias"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabPreferencias
                    preferencias={preferencias}
                    idCliente={usuario?.id_cliente}
                  />
                </motion.div>
              )}
              {activeTab === "cuenta" && (
                <motion.div
                  key="cuenta"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabCuenta
                    clienteData={clienteData}
                    onClienteActualizado={setClienteData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
