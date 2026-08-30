import { useState } from "react";
import {
  Megaphone, Plus, Pencil, Trash2, ArrowUp, ArrowDown, ImageIcon, Calendar, Link as LinkIcon,
} from "lucide-react";
import { Banner, BannerFormData, resolveImagenBanner } from "../../services/banner.service";
import AdminModal from "./ui/AdminModal";
import SectionHeader from "./ui/SectionHeader";
import EmptyState from "./ui/EmptyState";
import StatusBadge from "./ui/StatusBadge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";

interface Props {
  banners: Banner[];
  onSubmit: (data: BannerFormData, id?: number) => Promise<void>;
  onDelete: (id: number) => void;
  onToggleActivo: (banner: Banner) => Promise<void>;
  onReordenar: (items: { id_banner: number; orden: number }[]) => Promise<void>;
  loading: boolean;
}

const FORM_VACIO: BannerFormData = {
  titulo: "", descripcion_corta: "", texto_boton: "", link_destino: "",
  fecha_inicio: "", fecha_fin: "", activo: true,
};

function formatFecha(f: string | null): string {
  if (!f) return "Sin límite";
  return new Date(f + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// Sección 7 del plan de mejora: banners publicitarios administrables (home
// carousel / oferta destacada) — /api/banners es una tabla real nueva,
// distinta de /api/promociones (que deriva de hoteles). Ver
// BannersPromocionales.tsx para el consumo público.
export default function ModuleBanners({ banners, onSubmit, onDelete, onToggleActivo, onReordenar, loading }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerFormData>(FORM_VACIO);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ordenados = [...banners].sort((a, b) => a.orden - b.orden);

  const abrirCrear = () => {
    setEditing(null);
    setForm(FORM_VACIO);
    setImagenPreview(null);
    setError("");
    setModalOpen(true);
  };

  const abrirEditar = (banner: Banner) => {
    setEditing(banner);
    setForm({
      titulo: banner.titulo,
      descripcion_corta: banner.descripcion_corta ?? "",
      texto_boton: banner.texto_boton ?? "",
      link_destino: banner.link_destino ?? "",
      fecha_inicio: banner.fecha_inicio ?? "",
      fecha_fin: banner.fecha_fin ?? "",
      activo: banner.activo,
    });
    setImagenPreview(resolveImagenBanner(banner.imagen_url));
    setError("");
    setModalOpen(true);
  };

  const onSeleccionarImagen = (file: File | undefined) => {
    if (!file) return;
    setForm(prev => ({ ...prev, imagen: file }));
    // Preview local vía createObjectURL — nunca se sube nada hasta el submit
    // real del formulario (ver AdminModal / handleSubmit más abajo).
    setImagenPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!editing && !form.imagen) {
      setError("Selecciona una imagen para el banner.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(form, editing?.id_banner);
      setModalOpen(false);
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar el banner.");
    } finally {
      setSaving(false);
    }
  };

  const mover = (index: number, direction: -1 | 1) => {
    const destino = index + direction;
    if (destino < 0 || destino >= ordenados.length) return;
    const copia = [...ordenados];
    [copia[index], copia[destino]] = [copia[destino], copia[index]];
    onReordenar(copia.map((b, i) => ({ id_banner: b.id_banner, orden: i })));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Promociones y banners"
        subtitle="Banners publicitarios del sitio público (carrusel del home, ofertas destacadas)"
        action={
          <button
            onClick={abrirCrear}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo banner
          </button>
        }
      />

      {ordenados.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Todavía no hay banners"
          description="Crea el primero para que aparezca en el carrusel del home del sitio público."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordenados.map((banner, i) => (
            <div key={banner.id_banner} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-36 bg-muted">
                <img src={resolveImagenBanner(banner.imagen_url)} alt={banner.titulo} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <StatusBadge status={banner.activo ? "activo" : "inactivo"} />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <p className="font-semibold text-foreground text-sm truncate">{banner.titulo}</p>
                {banner.descripcion_corta && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{banner.descripcion_corta}</p>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  {formatFecha(banner.fecha_inicio)} → {formatFecha(banner.fecha_fin)}
                </div>
                {banner.link_destino && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                    <LinkIcon className="w-3 h-3 flex-shrink-0" /> {banner.link_destino}
                  </div>
                )}

                <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/60">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Subir"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => mover(i, 1)}
                      disabled={i === ordenados.length - 1}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Bajar"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={banner.activo}
                      onCheckedChange={() => onToggleActivo(banner)}
                    />
                    <button
                      onClick={() => abrirEditar(banner)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-all"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(banner.id_banner)}
                      className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar banner" : "Nuevo banner"}
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
            <Label>Imagen {!editing && <span className="text-destructive">*</span>}</Label>
            <label className="mt-1.5 flex items-center justify-center h-36 rounded-xl border-2 border-dashed border-border bg-muted/40 cursor-pointer overflow-hidden hover:border-primary/40 transition-colors">
              {imagenPreview ? (
                <img src={imagenPreview} alt="Vista previa" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Haz clic para elegir una imagen (JPG, PNG o WEBP, máx. 5MB)</span>
                </div>
              )}
              <input
                type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => onSeleccionarImagen(e.target.files?.[0])}
              />
            </label>
          </div>

          <div>
            <Label htmlFor="banner-titulo">Título</Label>
            <Input
              id="banner-titulo" value={form.titulo}
              onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ej. Escápate a San Andrés"
            />
          </div>

          <div>
            <Label htmlFor="banner-descripcion">Descripción corta</Label>
            <Textarea
              id="banner-descripcion" value={form.descripcion_corta}
              onChange={(e) => setForm(prev => ({ ...prev, descripcion_corta: e.target.value }))}
              placeholder="Una línea que aparece debajo del título en el banner"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="banner-boton">Texto del botón</Label>
              <Input
                id="banner-boton" value={form.texto_boton}
                onChange={(e) => setForm(prev => ({ ...prev, texto_boton: e.target.value }))}
                placeholder="Ej. Ver oferta"
              />
            </div>
            <div>
              <Label htmlFor="banner-link">Link de destino</Label>
              <Input
                id="banner-link" value={form.link_destino}
                onChange={(e) => setForm(prev => ({ ...prev, link_destino: e.target.value }))}
                placeholder="/search?destino=..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="banner-inicio">Vigente desde</Label>
              <Input
                id="banner-inicio" type="date" value={form.fecha_inicio}
                onChange={(e) => setForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="banner-fin">Vigente hasta</Label>
              <Input
                id="banner-fin" type="date" value={form.fecha_fin}
                onChange={(e) => setForm(prev => ({ ...prev, fecha_fin: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">Deja las fechas vacías para que no tenga límite en ese extremo.</p>

          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
            <Label htmlFor="banner-activo" className="cursor-pointer">Banner activo</Label>
            <Switch
              id="banner-activo" checked={form.activo}
              onCheckedChange={(v) => setForm(prev => ({ ...prev, activo: v }))}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </AdminModal>
    </div>
  );
}
