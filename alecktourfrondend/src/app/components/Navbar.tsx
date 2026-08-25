import {
  Building2,
  ChevronDown,
  Gift,
  LogIn,
  LogOut,
  Menu,
  Package,
  Phone,
  Plane,
  User,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { BASE_URL } from "../api/v1/api";
import { useAuth } from "../context/AuthContext";
import { ClienteResponse, clienteService } from "../services/cliente.service";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOffersMenu, setShowOffersMenu] = useState(false);
  const [showBenefitsMenu, setShowBenefitsMenu] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [cliente, setCliente] = useState<ClienteResponse | null>(null);

  const navigate = useNavigate();
  const { isAuthenticated, usuario, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated && usuario?.id_cliente) {
      clienteService
        .getById(usuario.id_cliente)
        .then(setCliente)
        .catch(() => setCliente(null));
    } else {
      setCliente(null);
    }
  }, [isAuthenticated, usuario?.id_cliente]);

  const handleLogout = () => {
    logout();
    setCliente(null);
    navigate("/");
  };

  function getRoleLabel(roles?: string[]) {
    if (!roles || roles.length === 0) return "Cliente";
    if (roles.includes("admin")) return "Admin";
    if (roles.includes("empleado")) return "Empleado";
    if (roles.includes("cliente")) return "Cliente";
    return roles[0];
  }

  const displayName = cliente
    ? `${cliente.nombre} ${cliente.apellido}`
    : (usuario?.username ?? "");

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="
          sticky top-0 z-[9999]
          bg-background/95
          text-foreground
          border-b border-border/50
          backdrop-blur-xl
        "
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[76px]">

            {/* =========================================================
                LOGO
            ========================================================= */}
            <Link
              to="/"
              className="flex items-center gap-3 group shrink-0"
            >
              <motion.div
                whileHover={{
                  scale: 1.06,
                  rotate: 3,
                }}
                whileTap={{ scale: 0.96 }}
                className="
                  relative
                  w-11 h-11
                  rounded-[14px]
                  flex items-center justify-center
                  bg-primary
                  text-primary-foreground
                  shadow-lg
                  shadow-primary/20
                  overflow-hidden
                "
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

                <Plane className="relative w-[19px] h-[19px]" />
              </motion.div>

              <div className="leading-none">
                <div
                  className="
                    text-[22px]
                    tracking-[-0.5px]
                    text-primary
                  "
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 800,
                  }}
                >
                  AlekTours
                </div>

                <div
                  className="
                    mt-1
                    text-[8px]
                    uppercase
                    tracking-[1.8px]
                    font-bold
                    text-muted-foreground/70
                  "
                >
                  Agencia de viajes
                </div>
              </div>
            </Link>

            {/* =========================================================
                DESKTOP NAVIGATION
            ========================================================= */}
            <div className="hidden xl:flex items-center gap-1 text-[12px] font-semibold">

              {/* OFERTAS */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowOffersMenu(true)}
                  onMouseLeave={() => setShowOffersMenu(false)}
                  className="
                    group
                    relative
                    flex items-center gap-1.5
                    px-3 py-2.5
                    rounded-xl
                    text-foreground/75
                    hover:text-primary
                    hover:bg-primary/[0.05]
                    transition-all
                  "
                >
                  <Plane className="w-3.5 h-3.5 text-primary transition-transform group-hover:-translate-y-0.5" />

                  <span>Ofertas</span>

                  <ChevronDown className="w-3 h-3 text-muted-foreground" />

                  <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
                </button>

                <AnimatePresence>
                  {showOffersMenu && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 8,
                        scale: 0.98,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: 8,
                        scale: 0.98,
                      }}
                      transition={{ duration: 0.16 }}
                      onMouseEnter={() => setShowOffersMenu(true)}
                      onMouseLeave={() => setShowOffersMenu(false)}
                      className="
                        absolute
                        top-full
                        left-0
                        mt-2
                        w-[270px]
                        bg-card
                        text-card-foreground
                        rounded-2xl
                        shadow-2xl
                        shadow-black/10
                        border border-border/60
                        overflow-hidden
                        p-2
                      "
                    >
                      <div className="px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-primary">
                          Descubre tu próximo viaje
                        </p>
                      </div>

                      <Link
                        to="/search"
                        className="
                          flex items-center gap-3
                          px-3 py-3
                          rounded-xl
                          hover:bg-accent
                          transition-all
                          group/item
                        "
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Plane className="w-4 h-4 text-primary" />
                        </div>

                        <div>
                          <span className="block text-sm font-bold">
                            Todos los destinos
                          </span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            Explora todas nuestras opciones
                          </span>
                        </div>
                      </Link>


                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* HOTELES */}
              <Link
                to="/search?type=hotel"
                className="
                  group
                  flex items-center gap-1.5
                  px-3 py-2.5
                  rounded-xl
                  text-foreground/75
                  hover:text-primary
                  hover:bg-primary/[0.05]
                  transition-all
                "
              >
                <Building2 className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                Hoteles
              </Link>

              {/* PAQUETES - CTA COMERCIAL */}
              <Link
                to="/search"
                className="
                  group
                  flex items-center gap-1.5
                  px-3.5 py-2.5
                  rounded-xl
                  bg-primary/[0.08]
                  text-primary
                  hover:bg-primary
                  hover:text-primary-foreground
                  transition-all
                  shadow-sm
                "
              >
                <Package className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Paquetes</span>
              </Link>

              {/* BENEFICIOS */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowBenefitsMenu(true)}
                  onMouseLeave={() => setShowBenefitsMenu(false)}
                  className="
                    group
                    flex items-center gap-1.5
                    px-3 py-2.5
                    rounded-xl
                    text-foreground/75
                    hover:text-primary
                    hover:bg-primary/[0.05]
                    transition-all
                  "
                >
                  <Gift className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                  Beneficios
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {showBenefitsMenu && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 8,
                        scale: 0.98,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: 8,
                        scale: 0.98,
                      }}
                      onMouseEnter={() => setShowBenefitsMenu(true)}
                      onMouseLeave={() => setShowBenefitsMenu(false)}
                      className="
                        absolute
                        top-full
                        left-0
                        mt-2
                        w-[270px]
                        bg-card
                        rounded-2xl
                        shadow-2xl
                        border border-border/60
                        overflow-hidden
                        p-2
                      "
                    >
                      <div className="px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-primary">
                          Viajar tiene sus ventajas
                        </p>
                      </div>

                      <Link
                        to="/benefits"
                        className="
                          flex items-center gap-3
                          px-3 py-3
                          rounded-xl
                          hover:bg-accent
                          transition-all
                        "
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Gift className="w-4 h-4 text-primary" />
                        </div>

                        <div>
                          <span className="block text-sm font-bold">
                            Programa de puntos
                          </span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            Obtén beneficios en tus viajes
                          </span>
                        </div>
                      </Link>

                      <Link
                        to="/corporate"
                        className="
                          flex items-center gap-3
                          px-3 py-3
                          rounded-xl
                          hover:bg-accent
                          transition-all
                        "
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>

                        <div>
                          <span className="block text-sm font-bold">
                            Convenios empresariales
                          </span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            Soluciones para empresas
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


              {/* AUTOS */}


              {/* MÁS */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowInfoMenu(true)}
                  onMouseLeave={() => setShowInfoMenu(false)}
                  className="
                    group
                    flex items-center gap-1
                    px-3 py-2.5
                    rounded-xl
                    text-foreground/75
                    hover:text-primary
                    hover:bg-primary/[0.05]
                    transition-all
                  "
                >
                  Más
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {showInfoMenu && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 8,
                        scale: 0.98,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: 8,
                        scale: 0.98,
                      }}
                      onMouseEnter={() => setShowInfoMenu(true)}
                      onMouseLeave={() => setShowInfoMenu(false)}
                      className="
                        absolute
                        top-full
                        right-0
                        mt-2
                        w-[230px]
                        bg-card
                        rounded-2xl
                        shadow-2xl
                        border border-border/60
                        overflow-hidden
                        p-2
                      "
                    >
                      <Link
                        to="/travel-info"
                        className="block px-4 py-3 rounded-xl hover:bg-accent transition-all"
                      >
                        <span className="block text-sm font-bold">
                          Info para tu viaje
                        </span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          Todo lo que necesitas saber
                        </span>
                      </Link>

                      <Link
                        to="/faq"
                        className="block px-4 py-3 rounded-xl hover:bg-accent transition-all"
                      >
                        <span className="block text-sm font-bold">
                          Preguntas frecuentes
                        </span>
                      </Link>

                      <Link
                        to="/contact"
                        className="block px-4 py-3 rounded-xl hover:bg-accent transition-all"
                      >
                        <span className="block text-sm font-bold">
                          Contáctanos
                        </span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* =========================================================
                RIGHT SIDE
            ========================================================= */}
            <div className="hidden xl:flex items-center gap-3 shrink-0">

              {/* CONTACT */}
              <div
                className="
                  hidden 2xl:flex
                  items-center gap-2.5
                  px-3 py-2
                  rounded-xl
                  bg-muted/40
                  border border-border/40
                "
              >
                <div className="
                  w-8 h-8
                  rounded-lg
                  bg-primary/10
                  flex items-center justify-center
                ">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>

                <div className="leading-tight">


                  <small className="text-[8px] text-muted-foreground">
                    Asesoría 24/7
                  </small>
                </div>
              </div>

              <ThemeToggle />

              {/* AUTH */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">

                  <Link
                    to="/profile"
                    className="
                      group
                      flex items-center gap-2.5
                      px-3 py-2
                      rounded-xl
                      border border-border/70
                      bg-card
                      hover:border-primary/30
                      hover:bg-primary/[0.04]
                      transition-all
                    "
                  >
                    <div className="
                      w-8 h-8
                      rounded-lg
                      bg-primary/10
                      flex items-center justify-center
                      group-hover:bg-primary
                      transition-colors
                      overflow-hidden
                    ">
                      {usuario?.foto_perfil ? (
                        <img
                          src={`${BASE_URL}${usuario.foto_perfil}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="
                          w-3.5 h-3.5
                          text-primary
                          group-hover:text-primary-foreground
                          transition-colors
                        " />
                      )}
                    </div>

                    <div className="leading-tight max-w-[120px]">
                      <span className="block truncate text-[10px] font-bold">
                        {displayName}
                      </span>

                      <span className="block text-[8px] text-muted-foreground uppercase tracking-wider">
                        {getRoleLabel(usuario?.roles)}
                      </span>
                    </div>

                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Link>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="
                      w-9 h-9
                      flex items-center justify-center
                      rounded-xl
                      text-muted-foreground
                      hover:text-destructive
                      hover:bg-destructive/10
                      transition-all
                    "
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    y: -1,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLoginModal(true)}
                  className="
                    group
                    flex items-center gap-2
                    px-4 py-2.5
                    rounded-xl
                    border border-primary/20
                    bg-primary/[0.06]
                    text-primary
                    hover:bg-primary
                    hover:text-primary-foreground
                    hover:border-primary
                    transition-all
                    font-bold
                    text-[11px]
                  "
                >
                  <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  Iniciar sesión
                </motion.button>
              )}
            </div>

            {/* =========================================================
                MOBILE
            ========================================================= */}
            <div className="flex items-center gap-2 xl:hidden">
              <ThemeToggle />

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="
                  w-10 h-10
                  flex items-center justify-center
                  rounded-xl
                  border border-border/60
                  hover:bg-muted
                  text-foreground
                  transition-all
                "
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>

          {/* =========================================================
              MOBILE MENU
          ========================================================= */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                transition={{ duration: 0.25 }}
                className="
                  xl:hidden
                  border-t border-border/50
                  overflow-hidden
                  bg-background
                "
              >
                <div className="py-4 space-y-1">

                  <Link
                    to="/"
                    className="
                      block px-4 py-3
                      text-sm font-semibold
                      text-foreground
                      hover:bg-muted
                      rounded-xl
                      transition-all
                    "
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Inicio
                  </Link>

                  <Link
                    to="/search"
                    className="
                      flex items-center justify-between
                      px-4 py-3
                      text-sm font-semibold
                      text-primary
                      bg-primary/[0.06]
                      hover:bg-primary/[0.1]
                      rounded-xl
                      transition-all
                    "
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <Package className="w-4 h-4" />
                      Explorar paquetes
                    </span>

                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </Link>

                  <Link
                    to="/search?type=hotel"
                    className="
                      flex items-center gap-3
                      px-4 py-3
                      text-sm font-semibold
                      text-foreground
                      hover:bg-muted
                      rounded-xl
                      transition-all
                    "
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building2 className="w-4 h-4 text-primary" />
                    Hoteles
                  </Link>

                  <Link
                    to="/benefits"
                    className="
                      flex items-center gap-3
                      px-4 py-3
                      text-sm font-semibold
                      text-foreground
                      hover:bg-muted
                      rounded-xl
                      transition-all
                    "
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Gift className="w-4 h-4 text-primary" />
                    Beneficios
                  </Link>

                  <Link
                    to="/contact"
                    className="
                      flex items-center gap-3
                      px-4 py-3
                      text-sm font-semibold
                      text-foreground
                      hover:bg-muted
                      rounded-xl
                      transition-all
                    "
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    Contáctanos
                  </Link>

                  {/* CONTACT CARD */}
                  <div className="
                    mt-3
                    mx-1
                    p-4
                    rounded-2xl
                    bg-muted/50
                    border border-border/50
                  ">
                    <div className="flex items-center gap-3">
                      <div className="
                        w-10 h-10
                        rounded-xl
                        bg-primary/10
                        flex items-center justify-center
                      ">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>

                      <div>
                        <p className="text-xs font-bold">
                          ¿Necesitas ayuda?
                        </p>

                        <p className="text-[11px] text-muted-foreground">
                          +57 601 123 4567 · Asesoría 24/7
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AUTH */}
                  {isAuthenticated ? (
                    <div className="pt-3 mt-2 border-t border-border/50">

                      <Link
                        to="/profile"
                        className="
                          flex items-center gap-3
                          px-4 py-3
                          bg-primary
                          text-primary-foreground
                          rounded-xl
                          shadow-lg
                          shadow-primary/20
                        "
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="
                          w-9 h-9
                          rounded-lg
                          bg-primary-foreground/15
                          flex items-center justify-center
                          overflow-hidden
                        ">
                          {usuario?.foto_perfil ? (
                            <img
                              src={`${BASE_URL}${usuario.foto_perfil}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex flex-col items-start leading-tight">
                          <span className="font-bold text-sm">
                            {displayName}
                          </span>

                          <span className="text-[9px] opacity-70 uppercase tracking-wider">
                            {getRoleLabel(usuario?.roles)}
                          </span>
                        </div>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="
                          w-full
                          mt-2
                          px-4 py-3
                          text-destructive
                          hover:bg-destructive/10
                          rounded-xl
                          text-center
                          font-semibold
                          text-sm
                          transition-all
                        "
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  ) : (
                    <div className="
                      flex flex-col gap-2
                      pt-3 mt-2
                      border-t border-border/50
                    ">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowLoginModal(true);
                        }}
                        className="
                          flex items-center justify-center gap-2
                          px-4 py-3
                          bg-primary
                          text-primary-foreground
                          rounded-xl
                          text-center
                          font-bold
                          text-sm
                          shadow-lg
                          shadow-primary/20
                        "
                      >
                        <LogIn className="w-4 h-4" />
                        Iniciar sesión
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowRegisterModal(true);
                        }}
                        className="
                          px-4 py-3
                          border border-border
                          text-foreground
                          rounded-xl
                          text-center
                          font-semibold
                          text-sm
                          hover:bg-muted
                          transition-all
                        "
                      >
                        Crear cuenta
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Modales fuera del nav sticky */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </>
  );
}