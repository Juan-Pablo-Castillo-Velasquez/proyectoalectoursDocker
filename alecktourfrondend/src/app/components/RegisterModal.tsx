import { AlertCircle, Calendar, CheckCircle, CreditCard, Eye, EyeOff, Lock, Mail, MapPin, Phone, Plane, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { apiFetch } from "../api/v1/api";
import { authService } from "../services/auth.service";
import PrivacidadModal from "./PrivacidadModal";
import TerminosModal from "./TerminosModal";
import ModalBackdrop from "./ui/ModalBackdrop";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin?: () => void;
}

const initialFormData = {
    correo_electronico: "", password: "", confirmPassword: "",
    nombre: "", apellido: "", cedula: "", celular: "",
    direccion: "", ciudad: "", pais: "Colombia", fecha_nacimiento: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mínimo 6 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

function calcAge(dateStr: string) {
    if (!dateStr) return 0;
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

interface FieldProps {
    icon: React.ReactNode;
    error?: string;
    suffix?: React.ReactNode;
    children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
}

function Field({ icon, error, suffix, children }: FieldProps) {
    return (
        <div className="space-y-1.5 w-full">
            <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200">
                    {icon}
                </span>
                {children}
                {suffix && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">{suffix}</span>
                )}
            </div>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-destructive font-medium flex items-center gap-1 pl-1"
                    >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

// Indicador visual de fuerza de contraseña
function PasswordStrength({ password }: { password: string }) {
    if (!password) return null;
    const hasLower   = /[a-z]/.test(password);
    const hasUpper   = /[A-Z]/.test(password);
    const hasNumber  = /\d/.test(password);
    const hasLength  = password.length >= 6;

    const checks = [
        { label: "Minúscula", ok: hasLower },
        { label: "Mayúscula", ok: hasUpper },
        { label: "Número",    ok: hasNumber },
        { label: "6+ chars",  ok: hasLength },
    ];

    const passed = checks.filter(c => c.ok).length;
    const barColor =
        passed <= 1 ? "bg-destructive" :
        passed <= 2 ? "bg-[#C9A227]" :
        passed <= 3 ? "bg-[#A13B55]" :
        "bg-[#7B1E3A]";

    return (
        <div className="space-y-1.5 px-1">
            <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= passed ? barColor : "bg-border"}`} />
                ))}
            </div>
            <div className="flex gap-2 flex-wrap">
                {checks.map(({ label, ok }) => (
                    <span key={label} className={`text-[10px] font-medium flex items-center gap-0.5 transition-colors ${ok ? "text-[#7B1E3A]" : "text-muted-foreground"}`}>
                        <span>{ok ? "✓" : "○"}</span> {label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [verificationToken, setVerificationToken] = useState("");
    const [email, setEmail] = useState("");
    const [formData, setFormData] = useState(initialFormData);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [formError, setFormError] = useState("");
    const [showTerminos, setShowTerminos] = useState(false);
    const [showPrivacidad, setShowPrivacidad] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (formError) setFormError("");
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTouched((t) => ({ ...t, [e.target.name]: true }));
    };

    const errors = useMemo(() => {
        const e: Record<string, string> = {};
        if (formData.correo_electronico && !EMAIL_REGEX.test(formData.correo_electronico))
            e.correo_electronico = "Correo inválido";
        if (formData.password && !PASSWORD_REGEX.test(formData.password))
            e.password = "Debe tener mayúscula, minúscula y número";
        if (formData.confirmPassword && formData.confirmPassword !== formData.password)
            e.confirmPassword = "Las contraseñas no coinciden";
        if (formData.cedula && !/^\d{6,12}$/.test(formData.cedula))
            e.cedula = "Solo números, 6–12 dígitos";
        if (formData.celular && !/^\d{7,10}$/.test(formData.celular))
            e.celular = "Solo números, 7–10 dígitos";
        if (formData.fecha_nacimiento && calcAge(formData.fecha_nacimiento) < 18)
            e.fecha_nacimiento = "Debes ser mayor de 18 años";
        return e;
    }, [formData]);

    const requiredFilled =
        EMAIL_REGEX.test(formData.correo_electronico) &&
        PASSWORD_REGEX.test(formData.password) &&
        formData.confirmPassword === formData.password &&
        formData.nombre.trim().length > 0 &&
        formData.apellido.trim().length > 0 &&
        /^\d{6,12}$/.test(formData.cedula) &&
        formData.fecha_nacimiento.length > 0 &&
        calcAge(formData.fecha_nacimiento) >= 18 &&
        (formData.celular === "" || /^\d{7,10}$/.test(formData.celular));

    const isFormValid = requiredFilled && acceptedTerms;
    const fieldError = (name: string) => (touched[name] ? errors[name] : undefined);

    const resetState = () => {
        setFormData(initialFormData);
        setSuccess(false);
        setVerificationToken("");
        setEmail("");
        setAcceptedTerms(false);
        setTouched({});
        setFormError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleClose = () => { resetState(); onClose(); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        setFormError("");
        setLoading(true);
        try {
            // username = correo_electronico (mismo valor)
            const username = formData.correo_electronico;

            const res = await authService.register({
                username,
                correo_electronico: formData.correo_electronico,
                password: formData.password,
            });
            // Auto-login: el registro devuelve un access_token (rol cliente).
            // Se guarda para que crear/vincular el cliente (que exigen sesión)
            // no fallen con 401.
            if (res.access_token) {
                localStorage.setItem("token", res.access_token);
            }
            const cliente = await apiFetch<{ id_cliente: number }>("/clientes", {
                method: "POST",
                body: {
                    nombre: formData.nombre, apellido: formData.apellido,
                    cedula: formData.cedula, correo: formData.correo_electronico,
                    celular: formData.celular, direccion: formData.direccion,
                    ciudad: formData.ciudad, pais: formData.pais,
                    fecha_nacimiento: formData.fecha_nacimiento,
                },
            });
            await apiFetch(`/api/usuarios/${res.user_id}/vincular-cliente`, {
                method: "PUT",
                body: { id_cliente: cliente.id_cliente },
            });
            setVerificationToken(res.verification_token);
            setEmail(res.email);
            setSuccess(true);
        } catch (err: any) {
            const message = err?.message || "Error al crear la cuenta";
            setFormError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setVerifying(true);
        try {
            await authService.verifyEmail(verificationToken);
            toast.success("¡Cuenta verificada! Ya puedes iniciar sesión.");
            handleClose();
            setTimeout(() => onSwitchToLogin?.(), 300);
        } catch (err: any) {
            toast.error(err.message || "Error al verificar");
        } finally {
            setVerifying(false);
        }
    };

    const inputBase = (name: string) =>
        `w-full pl-11 pr-4 py-3 text-sm rounded-lg border outline-none transition-all duration-200 bg-input-background text-foreground font-medium placeholder:text-muted-foreground/60 focus:bg-card ${fieldError(name)
            ? "border-destructive focus:border-destructive focus:ring-4 focus:ring-destructive/10"
            : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"
        }`;

    return (
        <>
            <TerminosModal isOpen={showTerminos} onClose={() => setShowTerminos(false)} />
            <PrivacidadModal isOpen={showPrivacidad} onClose={() => setShowPrivacidad(false)} />

            <AnimatePresence>
                {isOpen && (
                    <ModalBackdrop zIndex={100} onClick={handleClose}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 360 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-lg my-8 rounded-xl shadow-2xl border border-border overflow-hidden bg-card text-card-foreground max-h-[90vh] flex flex-col"
                        >
                            {/* ── Header ── */}
                            <div className="relative px-8 py-6 flex-shrink-0 overflow-hidden bg-primary text-primary-foreground">
                                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-xl" />
                                <div className="absolute top-4 -right-4 w-20 h-20 rounded-full bg-white/5 blur-lg" />

                                <button
                                    onClick={handleClose}
                                    className="absolute top-5 right-5 p-2 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-all duration-200"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-4 relative">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner border border-white/10">
                                        <Plane className="w-6 h-6 text-primary-foreground transform -rotate-12" />
                                    </div>
                                    <div>
                                        <p className="text-primary-foreground/70 text-[11px] font-bold tracking-widest uppercase">AlekTours</p>
                                        <h1 className="text-primary-foreground font-medium text-2xl tracking-tight leading-none mt-0.5">Crea tu cuenta</h1>
                                    </div>
                                </div>

                                <p className="text-primary-foreground/80 text-xs font-normal mt-3 relative max-w-[85%]">
                                    Únete y empieza a explorar el mundo con la mejor experiencia de viaje ✈️
                                </p>

                                <div className="flex items-center gap-4 mt-5 relative bg-black/10 backdrop-blur-sm rounded-lg px-4 py-2 w-fit">
                                    {["Acceso", "Perfil", "Listo"].map((step, i) => (
                                        <div key={step} className="flex items-center gap-2">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${i === 0 ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/30"}`} />
                                            <span className={`text-[10px] font-bold tracking-wider uppercase ${i === 0 ? "text-primary-foreground" : "text-primary-foreground/40"}`}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Cuerpo ── */}
                            <div className="px-8 py-6 overflow-y-auto flex-1 bg-card">
                                {success ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8 px-4"
                                    >
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-accent text-accent-foreground shadow-xl ring-4 ring-primary/5">
                                            <CheckCircle className="w-10 h-10" />
                                        </div>
                                        <h2 className="text-2xl font-medium text-foreground mb-2 tracking-tight">¡Todo listo!</h2>
                                        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                                            Cuenta creada exitosamente bajo el correo: <br />
                                            <span className="font-bold text-foreground underline decoration-primary decoration-2">{email}</span>
                                        </p>
                                        <button
                                            onClick={handleVerify}
                                            disabled={verifying}
                                            className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm tracking-wide transition-all shadow-md hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                                        >
                                            {verifying ? "Verificando..." : "✓ Verificar mi cuenta"}
                                        </button>
                                        <p className="text-[11px] font-medium text-muted-foreground mt-3 mb-6 bg-muted py-1.5 rounded-lg border border-border">En producción esto llegará de manera directa por email</p>
                                        <button
                                            onClick={() => { handleClose(); onSwitchToLogin?.(); }}
                                            className="text-sm font-medium text-primary hover:underline transition-colors"
                                        >
                                            Ir a iniciar sesión →
                                        </button>
                                    </motion.div>
                                ) : (
                                    <>
                                        <AnimatePresence>
                                            {formError && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-xs font-medium mb-6 shadow-sm"
                                                >
                                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <span>{formError}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <form onSubmit={handleSubmit} className="space-y-6">

                                            {/* Sección 1: Datos de Acceso */}
                                            <div className="bg-muted/40 border border-border p-5 rounded-lg space-y-4 shadow-sm">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold shadow-sm">1</div>
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos de acceso</span>
                                                    <div className="flex-1 h-px bg-border" />
                                                </div>

                                                <div className="space-y-3">
                                                    {/* Correo — sirve también como username */}
                                                    <Field icon={<Mail className="w-4 h-4" />} error={fieldError("correo_electronico")}>
                                                        <input
                                                            type="email"
                                                            name="correo_electronico"
                                                            value={formData.correo_electronico}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            placeholder="Correo electrónico (será tu usuario)"
                                                            autoComplete="email"
                                                            inputMode="email"
                                                            required
                                                            className={inputBase("correo_electronico")}
                                                        />
                                                    </Field>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <Field
                                                            icon={<Lock className="w-4 h-4" />}
                                                            error={fieldError("password")}
                                                            suffix={
                                                                <button type="button" tabIndex={-1}
                                                                    onClick={() => setShowPassword(s => !s)}
                                                                    className="text-muted-foreground hover:text-primary transition-colors p-1">
                                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                </button>
                                                            }
                                                        >
                                                            <input
                                                                type={showPassword ? "text" : "password"}
                                                                name="password"
                                                                value={formData.password}
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                placeholder="Contraseña"
                                                                autoComplete="new-password"
                                                                required
                                                                className={inputBase("password") + " pr-10"}
                                                            />
                                                        </Field>
                                                        <Field
                                                            icon={<Lock className="w-4 h-4" />}
                                                            error={fieldError("confirmPassword")}
                                                            suffix={
                                                                <button type="button" tabIndex={-1}
                                                                    onClick={() => setShowConfirmPassword(s => !s)}
                                                                    className="text-muted-foreground hover:text-primary transition-colors p-1">
                                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                </button>
                                                            }
                                                        >
                                                            <input
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                name="confirmPassword"
                                                                value={formData.confirmPassword}
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                placeholder="Confirmar"
                                                                autoComplete="new-password"
                                                                required
                                                                className={inputBase("confirmPassword") + " pr-10"}
                                                            />
                                                        </Field>
                                                    </div>

                                                    {/* Indicador de fuerza — solo si hay algo escrito */}
                                                    <PasswordStrength password={formData.password} />
                                                </div>
                                            </div>

                                            {/* Sección 2: Datos Personales */}
                                            <div className="bg-muted/40 border border-border p-5 rounded-lg space-y-4 shadow-sm">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold shadow-sm">2</div>
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos personales</span>
                                                    <div className="flex-1 h-px bg-border" />
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Field icon={<User className="w-4 h-4" />}>
                                                            <input type="text" name="nombre" value={formData.nombre}
                                                                onChange={handleChange} onBlur={handleBlur}
                                                                placeholder="Nombre" autoComplete="given-name" required className={inputBase("nombre")} />
                                                        </Field>
                                                        <Field icon={<User className="w-4 h-4" />}>
                                                            <input type="text" name="apellido" value={formData.apellido}
                                                                onChange={handleChange} onBlur={handleBlur}
                                                                placeholder="Apellido" autoComplete="family-name" required className={inputBase("apellido")} />
                                                        </Field>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Field icon={<CreditCard className="w-4 h-4" />} error={fieldError("cedula")}>
                                                            <input type="text" name="cedula" value={formData.cedula}
                                                                onChange={handleChange} onBlur={handleBlur}
                                                                placeholder="Cédula" required inputMode="numeric"
                                                                className={inputBase("cedula")} />
                                                        </Field>
                                                        <Field icon={<Phone className="w-4 h-4" />} error={fieldError("celular")}>
                                                            <input type="tel" name="celular" value={formData.celular}
                                                                onChange={handleChange} onBlur={handleBlur}
                                                                placeholder="Celular" inputMode="numeric" autoComplete="tel"
                                                                className={inputBase("celular")} />
                                                        </Field>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Field icon={<MapPin className="w-4 h-4" />}>
                                                            <select
                                                                name="ciudad"
                                                                value={formData.ciudad}
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                className={inputBase("ciudad")}
                                                            >
                                                                <option value="" disabled>Ciudad</option>
                                                                <option value="Bogotá">Bogotá</option>
                                                                <option value="Medellín">Medellín</option>
                                                                <option value="Cali">Cali</option>
                                                                <option value="Barranquilla">Barranquilla</option>
                                                                <option value="Cartagena">Cartagena</option>
                                                                <option value="Bucaramanga">Bucaramanga</option>
                                                                <option value="Pereira">Pereira</option>
                                                                <option value="Manizales">Manizales</option>
                                                                <option value="Santa Marta">Santa Marta</option>
                                                                <option value="Cúcuta">Cúcuta</option>
                                                            </select>
                                                        </Field>
                                                        <Field icon={<Calendar className="w-4 h-4" />} error={fieldError("fecha_nacimiento")}>
                                                            <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento}
                                                                onChange={handleChange} onBlur={handleBlur}
                                                                required className={inputBase("fecha_nacimiento") + " text-foreground"} />
                                                        </Field>
                                                    </div>

                                                    <Field icon={<MapPin className="w-4 h-4" />}>
                                                        <input type="text" name="direccion" value={formData.direccion}
                                                            onChange={handleChange} placeholder="Dirección (opcional)"
                                                            autoComplete="street-address"
                                                            className={inputBase("direccion")} />
                                                    </Field>
                                                </div>
                                            </div>

                                            {/* Checkbox Términos */}
                                            <label className="flex items-start gap-3 cursor-pointer select-none px-1 py-1 group">
                                                <div className="relative mt-0.5 flex-shrink-0">
                                                    <input type="checkbox" checked={acceptedTerms}
                                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                        className="sr-only peer" />
                                                    <div className="w-4 h-4 rounded border-2 border-border peer-checked:border-primary peer-checked:bg-primary transition-all duration-200 flex items-center justify-center group-hover:border-primary/80">
                                                        {acceptedTerms && (
                                                            <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-[11px] text-muted-foreground font-medium leading-normal">
                                                    He leído y acepto los{" "}
                                                    <button type="button"
                                                        onClick={(e) => { e.preventDefault(); setShowTerminos(true); }}
                                                        className="text-primary hover:underline font-bold transition-colors">
                                                        Términos y Condiciones
                                                    </button>{" "}
                                                    y la{" "}
                                                    <button type="button"
                                                        onClick={(e) => { e.preventDefault(); setShowPrivacidad(true); }}
                                                        className="text-primary hover:underline font-bold transition-colors">
                                                        Política de Privacidad
                                                    </button>{" "}
                                                    de AlekTours
                                                </span>
                                            </label>

                                            {/* Botón submit */}
                                            <div className="pt-2">
                                                <button type="submit" disabled={!isFormValid || loading}
                                                    className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm tracking-wide transition-all duration-200 shadow-md hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <svg className="animate-spin w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                            </svg>
                                                            Creando cuenta...
                                                        </span>
                                                    ) : "Crear cuenta →"}
                                                </button>
                                            </div>

                                            <p className="text-center text-xs font-medium text-muted-foreground">
                                                ¿Ya tienes cuenta?{" "}
                                                <button type="button"
                                                    onClick={() => { handleClose(); onSwitchToLogin?.(); }}
                                                    className="text-primary font-bold hover:underline transition-colors">
                                                    Inicia sesión
                                                </button>
                                            </p>
                                        </form>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </ModalBackdrop>
                )}
            </AnimatePresence>
        </>
    );
}