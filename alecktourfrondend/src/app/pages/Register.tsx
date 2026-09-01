import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, User, Plane, CheckCircle, Phone, MapPin, Calendar, CreditCard, Eye, EyeOff } from "lucide-react";
import { authService } from "../services/auth.service";
import { apiFetch } from "../api/v1/api";
import { toast, Toaster } from "sonner";

// Indicador simple de fortaleza (sin librería nueva): suma un punto por cada
// criterio real cumplido — nunca bloquea el envío (el backend es quien
// decide si la contraseña es aceptable), solo orienta al usuario mientras
// escribe.
type PasswordStrength = { score: number; label: string; color: string };
function evaluarFortaleza(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "bg-gray-200" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Débil", color: "bg-red-500" };
  if (score <= 3) return { score, label: "Media", color: "bg-amber-500" };
  return { score, label: "Fuerte", color: "bg-green-500" };
}

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    // cuenta
    username: "", correo_electronico: "", password: "", confirmPassword: "",
    // perfil
    nombre: "", apellido: "", cedula: "", celular: "",
    direccion: "", ciudad: "", pais: "Colombia", fecha_nacimiento: "",
  });

  const fortaleza = evaluarFortaleza(formData.password);
  const confirmarNoCoincide = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword)
      return toast.error("Las contraseñas no coinciden");

    setLoading(true);
    try {
      // 1. Registrar usuario
      const res = await authService.register({
        username: formData.username,
        correo_electronico: formData.correo_electronico,
        password: formData.password,
      });

      // 1b. Auto-login: el registro devuelve un access_token (usuario recién
      //     creado con rol cliente). Se guarda en localStorage para que el
      //     backend acepte las llamadas siguientes (crear y vincular cliente),
      //     que exigen sesión.
      if (res.access_token) {
        localStorage.setItem("token", res.access_token);
      }

      // 2. Crear cliente
      const cliente = await apiFetch<{ id_cliente: number }>('/clientes', {
        method: 'POST',
        body: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          cedula: formData.cedula,
          correo: formData.correo_electronico,
          celular: formData.celular,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          pais: formData.pais,
          fecha_nacimiento: formData.fecha_nacimiento,
        },
      });

      // 3. Vincular cliente al usuario
      await apiFetch(`/api/usuarios/${res.user_id}/vincular-cliente`, {
        method: 'PUT',
        body: { id_cliente: cliente.id_cliente },
      });

      setVerificationToken(res.verification_token);
      setEmail(res.email);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await authService.verifyEmail(verificationToken);
      toast.success("¡Cuenta verificada! Ya puedes iniciar sesión.");
      setTimeout(() => navigate('/login'), 1000);
    } catch (err: any) {
      toast.error(err.message || "Error al verificar");
    } finally {
      setVerifying(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB] via-[#06B6D4] to-[#F59E0B] flex items-center justify-center p-4">
      <Toaster position="top-center" richColors />
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Registrado como <span className="font-semibold text-gray-700">{email}</span>
        </p>
        <button onClick={handleVerify} disabled={verifying}
          className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
          {verifying ? "Verificando..." : "✓ Verificar mi cuenta"}
        </button>
        <p className="text-xs text-gray-400 mt-3">En producción esto llegaría por email</p>
        <Link to="/login" className="block text-sm text-gray-500 hover:text-[#2563EB] mt-4">
          Ir a iniciar sesión →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB] via-[#06B6D4] to-[#F59E0B] flex items-center justify-center p-4">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-2xl">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Plane className="w-7 h-7 text-[#2563EB]" />
          </div>
          <span className="text-3xl font-bold text-white">AlecTours</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h1>
            <p className="text-gray-600">Únete y descubre el mundo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN CUENTA */}
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Datos de acceso</h2>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="username" value={formData.username} onChange={handleChange}
                    placeholder="Nombre de usuario" required minLength={3} maxLength={50}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange}
                    placeholder="Correo electrónico" required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                        placeholder="Contraseña" required minLength={8}
                        className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-1.5">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${fortaleza.score > i * 1.7 ? fortaleza.color : "bg-gray-200"}`}
                            />
                          ))}
                        </div>
                        <p className={`text-[11px] mt-1 font-medium ${
                          fortaleza.label === "Débil" ? "text-red-500" : fortaleza.label === "Media" ? "text-amber-500" : "text-green-600"
                        }`}>
                          Seguridad: {fortaleza.label}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                        placeholder="Confirmar contraseña" required
                        className={`w-full pl-11 pr-10 py-3 border rounded-xl focus:ring-2 outline-none text-sm ${
                          confirmarNoCoincide ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#2563EB]"
                        }`} />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmarNoCoincide && (
                      <p className="text-[11px] mt-1.5 font-medium text-red-500">Las contraseñas no coinciden</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN PERFIL */}
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Datos personales</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                      placeholder="Nombre" required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                  </div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" name="apellido" value={formData.apellido} onChange={handleChange}
                      placeholder="Apellido" required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" name="cedula" value={formData.cedula} onChange={handleChange}
                      placeholder="Cédula" required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" name="celular" value={formData.celular} onChange={handleChange}
                      placeholder="Celular"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange}
                      placeholder="Ciudad"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                  </div>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange}
                    placeholder="Dirección"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none text-sm" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || confirmarNoCoincide}
              className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-[#2563EB] hover:text-[#1d4ed8] font-semibold">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}