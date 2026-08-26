import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import ProfileSidebar from "../components/profile/ProfileSidebar";
import TabCuenta from "../components/profile/TabCuenta";
import TabFavoritos from "../components/profile/TabFavoritos";
import TabPreferencias from "../components/profile/TabPreferencias";
import TabReservas from "../components/profile/TabReservas";
import { useAuth } from "../context/AuthContext";
import { ClienteResponse, clienteService } from "../services/cliente.service";
import {
  PreferenciaResponse,
  preferenciasService,
} from "../services/preferencias.service";
import { ReservaResponse, reservaService } from "../services/reserva.service";
export default function Profile() {
  const { usuario, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Permite que otras pantallas (p.ej. el wizard de /preferences al
  // terminar) vuelvan directo a una pestaña específica en vez de caer
  // siempre en "reservas" — ver PreferencesForm.tsx handleFinish.
  const [activeTab, setActiveTab] = useState(
    () => (location.state as { tab?: string } | null)?.tab ?? "reservas",
  );
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
