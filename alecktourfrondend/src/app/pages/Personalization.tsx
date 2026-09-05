import { useParams } from "react-router";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { packages } from "../data/packages";
import { Sparkles, CheckCircle, Info } from "lucide-react";

type EntertainmentClass = "classA" | "classB" | "classC";

export default function Personalization() {
  const { id } = useParams();
  const pkg = packages.find((p) => p.id === id);
  const [selectedClass, setSelectedClass] = useState<EntertainmentClass>("classB");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">Paquete no encontrado</h1>
        </div>
      </div>
    );
  }

  const classInfo = {
    classA: {
      label: "Clase Premium",
      description: "Experiencias exclusivas y VIP",
      circleColor: "bg-gold",
      iconColor: "text-gold-foreground",
      borderColor: "border-gold",
      bgColor: "bg-gold/10",
    },
    classB: {
      label: "Clase Confort",
      description: "El balance perfecto",
      circleColor: "bg-primary",
      iconColor: "text-primary-foreground",
      borderColor: "border-primary",
      bgColor: "bg-primary/10",
    },
    classC: {
      label: "Clase Esencial",
      description: "Lo mejor al mejor precio",
      circleColor: "bg-primary/15",
      iconColor: "text-primary",
      borderColor: "border-primary/40",
      bgColor: "bg-primary/5",
    },
  };

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-gold" />
            <h1 className="text-4xl font-bold text-foreground">
              Personaliza tu experiencia
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Selecciona las actividades que deseas incluir en tu viaje a{" "}
            <span className="font-semibold text-primary">
              {pkg.destination}
            </span>
          </p>
        </div>

        {/* Class Selection */}
        <div className="bg-card rounded-2xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Elige tu categoría de entretenimiento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["classA", "classB", "classC"] as EntertainmentClass[]).map(
              (classType) => (
                <label
                  key={classType}
                  className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all ${
                    selectedClass === classType
                      ? classInfo[classType].borderColor + " shadow-lg"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="class"
                    checked={selectedClass === classType}
                    onChange={() => setSelectedClass(classType)}
                    className="sr-only"
                  />

                  <div className="text-center">
                    <div
                      className={`w-16 h-16 rounded-full ${classInfo[classType].circleColor} flex items-center justify-center mx-auto mb-4`}
                    >
                      <Sparkles className={`w-8 h-8 ${classInfo[classType].iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {classInfo[classType].label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {classInfo[classType].description}
                    </p>
                  </div>

                  {selectedClass === classType && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </label>
              )
            )}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-card rounded-2xl shadow-md p-8">
          <div className="flex items-start gap-3 mb-6">
            <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Actividades disponibles -{" "}
                {classInfo[selectedClass].label}
              </h2>
              <p className="text-muted-foreground">
                Selecciona las actividades que te gustaría realizar durante tu
                viaje
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pkg.entertainment[selectedClass].map((activity, index) => (
              <label
                key={index}
                className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer border-2 transition-all ${
                  selectedActivities.includes(activity)
                    ? classInfo[selectedClass].borderColor +
                      " " +
                      classInfo[selectedClass].bgColor
                    : "border-border hover:border-primary/30 hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedActivities.includes(activity)}
                  onChange={() => toggleActivity(activity)}
                  className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{activity}</p>
                </div>
                {selectedActivities.includes(activity) && (
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </label>
            ))}
          </div>

          {/* Summary */}
          {selectedActivities.length > 0 && (
            <div
              className={`mt-8 p-6 rounded-xl ${
                classInfo[selectedClass].bgColor
              }`}
            >
              <h3 className="font-semibold text-foreground mb-3">
                Resumen de tu selección
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  <strong>Categoría:</strong>{" "}
                  {classInfo[selectedClass].label}
                </p>
                <p className="text-sm text-foreground">
                  <strong>Actividades seleccionadas:</strong>{" "}
                  {selectedActivities.length}
                </p>
                <div className="pt-3 border-t border-border">
                  <ul className="space-y-1">
                    {selectedActivities.map((activity, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex gap-4">
            <button className="flex-1 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:shadow-xl hover:brightness-110 transition-all duration-300">
              Guardar preferencias
            </button>
            <button className="px-8 py-4 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors">
              Cancelar
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-primary/5 rounded-2xl p-6 border border-primary/15">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                ¿Cómo funciona?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • Puedes cambiar tu selección hasta 7 días antes del viaje
                </li>
                <li>
                  • Algunas actividades pueden tener costo adicional dependiendo de
                  la temporada
                </li>
                <li>
                  • Te contactaremos para coordinar horarios de las actividades
                  seleccionadas
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
