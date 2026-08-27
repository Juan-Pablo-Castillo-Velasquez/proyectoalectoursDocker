import { AlertCircle, Eye, EyeOff, Lock, Mail, Plane, Shield, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ModalBackdrop from "./ui/ModalBackdrop";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth.service";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToRegister?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [formError, setFormError] = useState("");
    const [emailTouched, setEmailTouched] = useState(false);

    // Estado para mostrar bienvenida con rol
    const [welcomeInfo, setWelcomeInfo] = useState<{ username: string; isAdmin: boolean } | null>(null);

    // Forgot password
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMsg, setForgotMsg] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    const emailValid = EMAIL_REGEX.test(formData.username.trim());
    const isFormValid = useMemo(
        () => emailValid && formData.password.length > 0,
        [formData, emailValid]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formError) setFormError("");
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetAndClose = () => {
        setFormData({ username: "", password: "" });
        setFormError("");
        setShowPassword(false);
        setShowForgot(false);
        setForgotMsg("");
        setForgotEmail("");
        setWelcomeInfo(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        setFormError("");
        setLoading(true);
        try {
            const res = await authService.login(formData);
            login(res.access_token, {
                username: res.username ?? formData.username,
                user_id: res.user_id,
                id_cliente: res.id_cliente,
                roles: res.roles ?? [],
            });

            const roles = res.roles ?? [];
            const isAdmin = roles.includes("admin");
            const displayName = res.username ?? formData.username;

            // Mostrar pantalla de bienvenida con rol
            setWelcomeInfo({ username: displayName, isAdmin });
            toast.success(`¡Bienvenido, ${displayName}!`);

            // Cerrar y navegar después de 1.8s
            setTimeout(() => {
                resetAndClose();
                navigate(isAdmin ? "/admin" : "/profile");
            }, 1800);
        } catch (err: any) {
            const message = err?.message || "Usuario o contraseña incorrectos";
            setFormError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    async function handleForgot() {
        if (!forgotEmail) return;
        setForgotLoading(true);
        try {
            const res = await authService.forgotPassword(forgotEmail);
            setForgotMsg(res.message);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setForgotLoading(false);
        }
    }

    function closeForgotSub() {
        setShowForgot(false);
        setForgotMsg("");
        setForgotEmail("");
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalBackdrop zIndex={100} onClick={resetAndClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }}
                        transition={{ type: "spring", damping: 24, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-card text-card-foreground rounded-xl shadow-2xl overflow-hidden border border-border my-auto"
                    >
                        {/* Header */}
                        <div className="relative bg-primary text-primary-foreground px-8 pt-8 pb-12">
                            <button
                                onClick={resetAndClose}
                                className="absolute top-5 right-5 p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-12 h-12 bg-card text-primary rounded-md flex items-center justify-center shadow-lg mb-4">
                                <Plane className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold mb-1 text-primary-foreground">Bienvenido de nuevo</h1>
                            <p className="text-primary-foreground/80 text-sm">Inicia sesión para continuar tu viaje</p>
                        </div>

                        <div className="px-8 pb-8 -mt-6">
                            <div className="bg-card rounded-xl shadow-lg border border-border p-6">

                                {/* FIX 2: Pantalla de bienvenida con rol */}
                                <AnimatePresence mode="wait">
                                    {welcomeInfo ? (
                                        <motion.div
                                            key="welcome"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center py-4 text-center gap-3"
                                        >
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${welcomeInfo.isAdmin ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                                                {welcomeInfo.isAdmin
                                                    ? <Shield className="w-8 h-8" />
                                                    : <User className="w-8 h-8" />
                                                }
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-foreground">
                                                    ¡Hola, {welcomeInfo.username}!
                                                </p>
                                                <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-semibold ${welcomeInfo.isAdmin ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
                                                    {welcomeInfo.isAdmin
                                                        ? <><Shield className="w-3 h-3" /> Administrador</>
                                                        : <><User className="w-3 h-3" /> Cliente</>
                                                    }
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <AnimatePresence>
                                                {formError && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                        className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 text-sm overflow-hidden"
                                                    >
                                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                        <span>{formError}</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1.5">Correo electrónico</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                        <input
                                                            type="email"
                                                            name="username"
                                                            value={formData.username}
                                                            onChange={handleChange}
                                                            onBlur={() => setEmailTouched(true)}
                                                            placeholder="alek@example.com"
                                                            autoComplete="email"
                                                            inputMode="email"
                                                            required
                                                            // FIX 1: autoFocus eliminado para evitar el scroll
                                                            className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-md text-sm focus:ring-2 focus:border-transparent outline-none text-foreground transition-shadow placeholder:text-muted-foreground ${emailTouched && formData.username && !emailValid
                                                                ? "border-destructive focus:ring-destructive/30"
                                                                : "border-border focus:ring-ring"
                                                                }`}
                                                        />
                                                    </div>
                                                    {emailTouched && formData.username && !emailValid && (
                                                        <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1.5">
                                                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                            Ingresa un correo electrónico válido (con @)
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-muted-foreground mt-1.5">
                                                        Inicia sesión con el correo de tu cuenta, no con tu nombre de usuario.
                                                    </p>
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <label className="text-sm font-medium text-foreground">Contraseña</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowForgot(true)}
                                                            className="text-xs text-primary hover:underline font-medium"
                                                        >
                                                            ¿Olvidaste tu contraseña?
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleChange}
                                                            placeholder="••••••••"
                                                            autoComplete="current-password"
                                                            required
                                                            className="w-full pl-12 pr-12 py-3 bg-input-background border border-border rounded-md text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground transition-shadow placeholder:text-muted-foreground"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword((s) => !s)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                            tabIndex={-1}
                                                        >
                                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={!isFormValid || loading}
                                                    className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:shadow-xl hover:brightness-110 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100"
                                                >
                                                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {!welcomeInfo && (
                                <p className="text-center text-muted-foreground text-sm mt-5">
                                    ¿No tienes cuenta?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetAndClose();
                                            onSwitchToRegister?.();
                                        }}
                                        className="text-primary hover:underline font-semibold"
                                    >
                                        Regístrate gratis
                                    </button>
                                </p>
                            )}
                        </div>

                        {/* Sub-modal: olvidé contraseña */}
                        <AnimatePresence>
                            {showForgot && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl p-4"
                                    onClick={closeForgotSub}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-card text-card-foreground border border-border rounded-xl p-8 w-full max-w-sm shadow-2xl"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-accent text-accent-foreground rounded-md flex items-center justify-center">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-bold text-foreground">Recuperar contraseña</h2>
                                        </div>
                                        <p className="text-muted-foreground text-sm mb-6">
                                            Te enviaremos un enlace a tu correo para restablecer tu contraseña.
                                        </p>

                                        {forgotMsg ? (
                                            <div className="text-center py-2">
                                                <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <span className="text-3xl">✅</span>
                                                </div>
                                                <p className="text-foreground font-medium mb-1">¡Correo enviado!</p>
                                                <p className="text-muted-foreground text-sm">{forgotMsg}</p>
                                                <button
                                                    onClick={closeForgotSub}
                                                    className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:brightness-110 transition-all"
                                                >
                                                    Entendido
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative mb-4">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                    <input
                                                        type="email"
                                                        placeholder="tu@correo.com"
                                                        value={forgotEmail}
                                                        onChange={(e) => setForgotEmail(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && handleForgot()}
                                                        className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                                                    />
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleForgot}
                                                    disabled={forgotLoading || !forgotEmail}
                                                    className="w-full py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:hover:brightness-100"
                                                >
                                                    {forgotLoading ? "Enviando..." : "Enviar enlace"}
                                                </motion.button>

                                                <button
                                                    onClick={closeForgotSub}
                                                    className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}