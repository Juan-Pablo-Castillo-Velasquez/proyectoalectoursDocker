// Sección de blog/guías desactivada intencionalmente: el contenido que
// tenía (artículos de ejemplo con imágenes de stock de Unsplash y enlaces
// a /blog/* que no existen como rutas reales) era contenido de relleno,
// no datos reales del proyecto — mismo criterio que el resto de datos
// falsos ya removidos en la auditoría (ver Testimonials.tsx, Benefits.tsx).
// Se deja el componente montado en Home.tsx (sin renderizar nada) para no
// tener que tocar ese layout hasta que exista contenido real de blog.
export default function BlogGuides() {
  return null;
}
