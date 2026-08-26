import { CheckCircle2, ChevronLeft, ChevronRight, Plane, Sparkles, Ticket } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast, Toaster } from "sonner";
import {
  budgetOptions,
  interestCategories,
  paceOptions, transportPrefs,
  travelCompany,
  weatherPrefs
} from "../components/preferences.data";
import { useAuth } from "../context/AuthContext";
import { preferenciasService } from "../services/preferencias.service";

export default function PreferencesForm() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // TabPreferencias manda las preferencias ya guardadas (si existen) por
  // location.state al hacer clic en "Actualizar perfil" — antes este
  // formulario siempre arrancaba en blanco incluso al "actualizar".
  const preferenciasExistentes = (location.state as { preferencias?: any } | null)?.preferencias;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    interests: (preferenciasExistentes?.intereses as string[]) ?? [],
    company: preferenciasExistentes?.compania ?? "",
    budget: preferenciasExistentes?.presupuesto ?? "",
    weather: preferenciasExistentes?.clima ?? "",
    pace: preferenciasExistentes?.ritmo ?? "",
    transport: preferenciasExistentes?.transporte ?? "",
  });

  const toggleInterest = (id: string) =>
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));

  const updateField = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    const idCliente = usuario?.id_cliente;

    if (!idCliente) {
      toast.error("❌ Por favor, inicia sesión primero para guardar tus preferencias.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      await preferenciasService.savePreferences(idCliente, formData);
      toast.success("✅ ¡Preferencias guardadas! Estamos creando tu perfil personalizado.");
      // Antes esto mandaba siempre a /profile con la pestaña "reservas" por
      // defecto — el usuario terminaba el asistente y aparecía en su
      // historial de reservas en vez de ver las preferencias recién
      // guardadas, lo que se percibía como "me redirige mal".
      setTimeout(() => navigate("/profile", { state: { tab: "preferencias" } }), 2000);
    } catch (error: any) {
      console.error("❌ Error al guardar preferencias:", error);
      const mensajeError = error.message || error?.detail || "Hubo un error guardando tus preferencias. Intenta de nuevo.";
      toast.error(`❌ ${mensajeError}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7B1E3A] via-[#A13B55] to-[#C9A227]/30 py-10 px-4 flex justify-center items-center font-sans dark:from-[#0f0f10] dark:to-[#161618]">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-3xl bg-white dark:bg-[#161618] rounded-[var(--radius)] shadow-2xl p-6 md:p-10 transition-all border border-[#7B1E3A]/10 dark:border-[#2a2a2e]">

        {/* Header & Progreso */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[#7B1E3A] dark:text-[#a83255] font-bold text-sm uppercase tracking-widest">Paso {step} de 3</p>
              <h1 className="text-3xl font-black text-gray-900 dark:text-[#f5f5f5]">Personaliza tu viaje</h1>
            </div>
            <Plane className="w-10 h-10 text-[#7B1E3A] dark:text-[#a83255] opacity-20" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? "bg-[#7B1E3A] dark:bg-[#a83255]" : "bg-gray-100 dark:bg-[#1b1b1e]"}`} />
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">

          {/* PASO 1 — Intereses */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-[#f1e4e8] dark:bg-[#2a1a1f] p-4 rounded-xl border border-[#7B1E3A]/10">
                <p className="text-[#7B1E3A] dark:text-[#ffffff] font-medium text-sm">¿Qué te apasiona? Selecciona tus favoritos.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {interestCategories.map((cat) => {
                  const isSelected = formData.interests.includes(cat.id);
                  return (
                    <button key={cat.id} onClick={() => toggleInterest(cat.id)}
                      className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all group ${isSelected
                          ? "border-[#7B1E3A] bg-[#f1e4e8] text-[#7B1E3A] dark:border-[#a83255] dark:bg-[#2a1a1f] dark:text-[#ffffff] shadow-sm"
                          : "border-gray-100 dark:border-[#2a2a2e] hover:border-[#f1e4e8] dark:hover:border-[#2a1a1f] text-gray-400 dark:text-[#a0a0a0]"
                        }`}>
                      <cat.icon className={`w-10 h-10 mb-3 transition-transform group-hover:scale-110 ${isSelected ? "text-[#7B1E3A] dark:text-[#ffffff]" : "text-gray-300 dark:text-[#2a2a2e]"}`} />
                      <span className="text-xs font-bold uppercase tracking-tight text-center text-gray-800 dark:text-[#f5f5f5] group-hover:text-[#7B1E3A] dark:group-hover:text-white">{cat.label}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 mt-2 text-[#7B1E3A] dark:text-[#ffffff]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 2 — Compañía, presupuesto, clima */}
          {step === 2 && (
            <div className="space-y-8">
              <section>
                <label className="block text-gray-800 dark:text-[#f5f5f5] font-bold mb-4">¿Con quién vas a vivir esta aventura?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {travelCompany.map(item => {
                    const isSelected = formData.company === item.id;
                    return (
                      <button key={item.id} onClick={() => updateField("company", item.id)}
                        className={`p-4 border-2 rounded-xl flex flex-col items-center transition-all ${isSelected ? "border-[#C9A227] bg-[#f7f5f6] dark:bg-[#1b1b1e] text-[#C9A227]" : "border-gray-100 dark:border-[#2a2a2e] text-gray-400 dark:text-[#a0a0a0]"}`}>
                        <item.icon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase text-gray-800 dark:text-[#f5f5f5]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <label className="block text-gray-800 dark:text-[#f5f5f5] font-bold mb-4">Define tu presupuesto aproximado</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {budgetOptions.map(opt => {
                    const isSelected = formData.budget === opt.id;
                    return (
                      <button key={opt.id} onClick={() => updateField("budget", opt.id)}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${isSelected ? "border-[#7B1E3A] bg-[#f1e4e8] dark:border-[#a83255] dark:bg-[#2a1a1f]" : "border-gray-100 dark:border-[#2a2a2e]"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <opt.icon className={`w-5 h-5 ${isSelected ? "text-[#7B1E3A] dark:text-[#ffffff]" : "text-gray-300 dark:text-[#a0a0a0]"}`} />
                          <span className="font-bold text-gray-900 dark:text-[#f5f5f5]">{opt.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <label className="block text-gray-800 dark:text-[#f5f5f5] font-bold mb-4">Tu clima ideal es...</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  {weatherPrefs.map(w => {
                    const isSelected = formData.weather === w.id;
                    return (
                      <button key={w.id} onClick={() => updateField("weather", w.id)}
                        className={`flex-1 p-4 border-2 rounded-xl flex items-center gap-4 transition-all ${isSelected ? "border-[#C9A227] bg-[#f7f5f6] dark:bg-[#1b1b1e]" : "border-gray-100 dark:border-[#2a2a2e]"}`}>
                        <w.icon className={`w-8 h-8 ${isSelected ? "text-[#C9A227]" : "text-gray-300 dark:text-[#a0a0a0]"}`} />
                        <div className="text-left">
                          <p className="font-bold text-sm text-gray-900 dark:text-[#f5f5f5]">{w.label}</p>
                          <p className="text-[10px] text-gray-500 dark:text-[#a0a0a0] uppercase">{w.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* PASO 3 — Ritmo y transporte */}
          {step === 3 && (
            <div className="space-y-10">
              <h2 className="text-xl font-bold text-[#7B1E3A] dark:text-[#a83255] flex items-center gap-2 underline decoration-[#C9A227] decoration-2">
                <Sparkles className="w-5 h-5" /> Últimos toques mágicos
              </h2>

              <section>
                <label className="block text-gray-800 dark:text-[#f5f5f5] font-bold mb-4">¿Cómo quieres que sea el ritmo del viaje?</label>
                <div className="grid grid-cols-2 gap-4">
                  {paceOptions.map(p => {
                    const isSelected = formData.pace === p.id;
                    return (
                      <button key={p.id} onClick={() => updateField("pace", p.id)}
                        className={`p-6 border-2 rounded-xl text-center transition-all ${isSelected ? "border-[#7B1E3A] bg-[#f1e4e8] dark:border-[#a83255] dark:bg-[#2a1a1f]" : "border-gray-100 dark:border-[#2a2a2e]"}`}>
                        <p className="font-black text-lg text-gray-900 dark:text-[#f5f5f5]">{p.label}</p>
                        <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <label className="block text-gray-800 dark:text-[#f5f5f5] font-bold mb-4">¿Cuál es tu transporte preferido?</label>
                <div className="grid grid-cols-2 gap-4">
                  {transportPrefs.map(t => {
                    const isSelected = formData.transport === t.id;
                    return (
                      <button key={t.id} onClick={() => updateField("transport", t.id)}
                        className={`p-6 border-2 rounded-xl flex flex-col items-center transition-all ${isSelected ? "border-[#7B1E3A] bg-[#f1e4e8] dark:border-[#a83255] dark:bg-[#2a1a1f]" : "border-gray-100 dark:border-[#2a2a2e]"}`}>
                        <t.icon className={`w-10 h-10 mb-2 ${isSelected ? "text-[#7B1E3A] dark:text-white" : "text-gray-300 dark:text-[#2a2a2e]"}`} />
                        <p className="font-black text-gray-900 dark:text-[#f5f5f5]">{t.label}</p>
                        <p className="text-xs text-gray-500 dark:text-[#a0a0a0]">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="bg-[#f7f5f6] dark:bg-[#1b1b1e] p-4 rounded-xl border border-[#7B1E3A]/10 dark:border-[#2a2a2e] flex items-center gap-3">
                <Ticket className="text-[#C9A227]" />
                <p className="text-xs text-gray-700 dark:text-[#a0a0a0] font-medium">¡Excelente elección! Estamos preparando una selección de destinos basada en tus respuestas.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer navegación */}
        <div className="mt-12 flex justify-between items-center border-t border-gray-100 dark:border-[#2a2a2e] pt-8">
          {step > 1 ? (
            <button onClick={prevStep}
              className="flex items-center gap-2 text-gray-400 dark:text-[#a0a0a0] font-bold uppercase text-xs tracking-widest hover:text-[#7B1E3A] dark:hover:text-[#a83255] transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5" /> Regresar
            </button>
          ) : (
            <div />
          )}
          <button onClick={step === 3 ? handleFinish : nextStep} disabled={loading}
            className="px-10 py-4 bg-gradient-to-r from-[#7B1E3A] to-[#A13B55] dark:from-[#a83255] dark:to-[#a13b55] text-white font-black rounded-xl shadow-lg hover:opacity-95 transform active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 cursor-pointer">
            {loading ? "Guardando..." : step === 3 ? "¡Terminar mi Perfil!" : "Continuar"}
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}