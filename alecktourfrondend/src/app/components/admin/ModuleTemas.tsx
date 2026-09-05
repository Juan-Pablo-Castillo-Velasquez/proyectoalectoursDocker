import { useState } from "react";
import { Palette, Plus, Pencil, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Tema, TemaFormData } from "../../services/tema.service";
import AdminModal from "./ui/AdminModal";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";
import StatusBadge from "./ui/StatusBadge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "../ui/tooltip";

interface Props {
  temas: Tema[];
  onSubmit: (data: TemaFormData, id?: number) => Promise<void>;
  onDelete: (tema: Tema) => void;
  onActivar: (tema: Tema) => Promise<void>;
  loading: boolean;
}

const FORM_VACIO: TemaFormData = {
  nombre: "",
  color_primario_claro: "#6e1832",
  color_primario_oscuro: "#c24d6e",
  color_secundario_claro: "#b8912e",
  color_secundario_oscuro: "#e8c77a",
};

// ── Contraste WCAG 2.1 AA (Resolución MinTIC 1519 de 2020 exige este mismo
// nivel para sitios del Estado colombiano) — misma fórmula de luminancia
// relativa que se usó para verificar los 7 temas sembrados en la
// migración. Se recalcula en vivo mientras el admin edita colores, para
// que nunca guarde una combinación que no se lea bien. ──
function hexToRgbNums(hex: string): [number, number, number] | null {
  const limpio = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return null;
  return [
    parseInt(limpio.substring(0, 2), 16),
    parseInt(limpio.substring(2, 4), 16),
    parseInt(limpio.substring(4, 6), 16),
  ];
}

function luminanciaRelativa([r, g, b]: [number, number, number]): number {
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgbNums(hex1);
  const rgb2 = hexToRgbNums(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = luminanciaRelativa(rgb1);
  const l2 = luminanciaRelativa(rgb2);
  const [claro, oscuro] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (claro + 0.05) / (oscuro + 0.05);
}

const AA_MINIMO = 4.5;

function BadgeContraste({ hex, contra, etiqueta }: { hex: string; contra: string; etiqueta: string }) {
  const ratio = contraste(hex, contra);
  if (ratio === null) return null;
  const pasa = ratio >= AA_MINIMO;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
        pasa ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"
      }`}
    >
      {ratio.toFixed(2)}:1 {pasa ? "✓ AA" : `✗ mín. ${AA_MINIMO}:1`} · {etiqueta}
    </span>
  );
}

function CampoColor({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 rounded-lg border border-border cursor-pointer bg-transparent p-0.5 flex-shrink-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6e1832"
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}

// Temas de color de temporada (Navidad, Halloween, etc.) que el admin
// crea y activa para recolorear el acento de marca en TODO el sitio --
// ver TemaContext.tsx / theme.css. Solo un tema puede estar activo a la
// vez; el tema "Marca" (es_predeterminado) nunca se puede borrar, así
// siempre queda un color de respaldo si el admin elimina el resto.
export default function ModuleTemas({ temas, onSubmit, onDelete, onActivar, loading }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tema | null>(null);
  const [form, setForm] = useState<TemaFormData>(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const [activando, setActivando] = useState<number | null>(null);
  const [error, setError] = useState("");

  const abrirCrear = () => {
    setEditing(null);
    setForm(FORM_VACIO);
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (tema: Tema) => {
    setEditing(tema);
    setForm({
      nombre: tema.nombre,
      color_primario_claro: tema.color_primario_claro,
      color_primario_oscuro: tema.color_primario_oscuro,
      color_secundario_claro: tema.color_secundario_claro,
      color_secundario_oscuro: tema.color_secundario_oscuro,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    for (const [campo, valor] of Object.entries(form)) {
      if (campo === "nombre") continue;
      if (!/^#[0-9a-fA-F]{6}$/.test(valor)) {
        setError(`Color inválido en "${campo}" — usa un hex de 6 dígitos, ej. #6e1832.`);
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(form, editing?.id_tema);
      setModalOpen(false);
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar el tema.");
    } finally {
      setSaving(false);
    }
  };

  const handleActivar = async (tema: Tema) => {
    setActivando(tema.id_tema);
    try {
      await onActivar(tema);
    } finally {
      setActivando(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Temas de temporada"
        subtitle="Colores de acento (botones, enlaces, navbar, footer) que se pueden activar por temporada -- Navidad, Halloween y las que crees"
        action={
          <button
            onClick={abrirCrear}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo tema
          </button>
        }
      />

      {temas.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="Todavía no hay temas"
          description="Crea el primero -- necesitas al menos un tema activo para que el sitio tenga colores."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {temas.map((tema) => {
            const bloqueadoParaBorrar = tema.es_predeterminado || tema.activo;
            return (
              <div key={tema.id_tema} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="h-20 flex">
                  <div className="flex-1" style={{ backgroundColor: tema.color_primario_claro }} />
                  <div className="flex-1" style={{ backgroundColor: tema.color_primario_oscuro }} />
                  <div className="flex-1" style={{ backgroundColor: tema.color_secundario_claro }} />
                  <div className="flex-1" style={{ backgroundColor: tema.color_secundario_oscuro }} />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground text-sm truncate flex items-center gap-1.5">
                      {tema.nombre}
                      {tema.es_predeterminado && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>Tema de marca predeterminado -- no se puede eliminar</TooltipContent>
                        </Tooltip>
                      )}
                    </p>
                    <StatusBadge status={tema.activo ? "activo" : "inactivo"} />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <BadgeContraste hex={tema.color_primario_claro} contra="#ffffff" etiqueta="primario claro" />
                    <BadgeContraste hex={tema.color_primario_oscuro} contra="#ffffff" etiqueta="primario oscuro" />
                  </div>

                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/60">
                    <button
                      onClick={() => handleActivar(tema)}
                      disabled={tema.activo || activando === tema.id_tema}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {tema.activo ? "Activo" : activando === tema.id_tema ? "Activando..." : "Activar"}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEditar(tema)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <button
                              onClick={() => !bloqueadoParaBorrar && onDelete(tema)}
                              disabled={bloqueadoParaBorrar}
                              className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </TooltipTrigger>
                        {bloqueadoParaBorrar && (
                          <TooltipContent>
                            {tema.es_predeterminado ? "El tema de marca no se puede eliminar" : "Activa otro tema primero"}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar tema" : "Nuevo tema"}
        maxWidth="sm:max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || loading}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="tema-nombre">Nombre</Label>
            <Input
              id="tema-nombre" value={form.nombre}
              onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej. Navidad"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Primario -- botones, enlaces, sidebar
            </p>
            <div className="grid grid-cols-2 gap-3">
              <CampoColor
                label="Modo claro"
                value={form.color_primario_claro}
                onChange={(v) => setForm(prev => ({ ...prev, color_primario_claro: v }))}
              />
              <CampoColor
                label="Modo oscuro"
                value={form.color_primario_oscuro}
                onChange={(v) => setForm(prev => ({ ...prev, color_primario_oscuro: v }))}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <BadgeContraste hex={form.color_primario_claro} contra="#ffffff" etiqueta="claro vs texto blanco" />
              <BadgeContraste hex={form.color_primario_oscuro} contra="#ffffff" etiqueta="oscuro vs texto blanco" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Secundario -- badges, detalles dorados
            </p>
            <div className="grid grid-cols-2 gap-3">
              <CampoColor
                label="Modo claro"
                value={form.color_secundario_claro}
                onChange={(v) => setForm(prev => ({ ...prev, color_secundario_claro: v }))}
              />
              <CampoColor
                label="Modo oscuro"
                value={form.color_secundario_oscuro}
                onChange={(v) => setForm(prev => ({ ...prev, color_secundario_oscuro: v }))}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <BadgeContraste hex={form.color_secundario_claro} contra="#1f1a12" etiqueta="claro vs texto oscuro" />
              <BadgeContraste hex={form.color_secundario_oscuro} contra="#1f1a12" etiqueta="oscuro vs texto oscuro" />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Verificación de contraste según WCAG 2.1 AA (mínimo 4.5:1) -- el
            mismo nivel que exige la Resolución MinTIC 1519 de 2020 para
            sitios del Estado colombiano. Un tema puede guardarse aunque
            algún color falle, pero no se recomienda: el texto encima
            podría no leerse bien.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </AdminModal>
    </div>
  );
}
