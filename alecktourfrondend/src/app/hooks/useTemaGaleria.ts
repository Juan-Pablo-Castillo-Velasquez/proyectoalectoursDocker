import { useEffect, useState } from "react";
import { useTema } from "../context/TemaContext";
import { temaService } from "../services/tema.service";

interface TemaGaleria {
  /** URLs reales de Cloudinary para la temporada activa -- [] mientras
   * carga, mientras no hay tema de temporada activo (tema por defecto),
   * o si la carpeta de esa temporada en Cloudinary todavía no tiene
   * ninguna imagen. Nunca lanza ni bloquea el render de nada. */
  imagenes: string[];
  cargando: boolean;
}

// Trae la galería dinámica de Cloudinary del tema de temporada activo (ver
// backend/app/routes/tema_route.py::get_galeria_tema) -- separado de
// useTema() porque la mayoría de componentes solo necesitan saber SI hay
// un tema activo (para decidir si decorar o no), no la lista de imágenes;
// pedirla solo donde de verdad se van a mostrar imágenes evita disparar
// este fetch desde cada tarjeta de la página.
//
// Un componente decorativo típico se ve así:
//   const { temaActivo } = useTema();
//   const { imagenes } = useTemaGaleria();
//   if (temaActivo?.clave === "halloween") { ...usar imagenes o caer a SVG... }
export function useTemaGaleria(): TemaGaleria {
  const { temaActivo } = useTema();
  const clave = temaActivo && !temaActivo.es_predeterminado ? temaActivo.clave : null;

  const [imagenes, setImagenes] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!clave) {
      setImagenes([]);
      return;
    }
    let activo = true;
    setCargando(true);
    temaService
      .getGaleria(clave)
      .then((urls) => {
        if (activo) setImagenes(urls);
      })
      .catch(() => {
        // Cloudinary sin configurar, carpeta vacía o error de red -- la
        // decoración simplemente cae a los acentos SVG dibujados a mano,
        // nunca rompe la página por esto.
        if (activo) setImagenes([]);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [clave]);

  return { imagenes, cargando };
}
