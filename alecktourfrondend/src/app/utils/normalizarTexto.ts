// Quita tildes/diacríticos para comparar texto sin distinguir acentos (ej.
// "medellin" debe encontrar "Medellín") -- usado por los filtros de destino
// de SearchResults.tsx (hoteles) y Packages.tsx (paquetes), que antes
// comparaban con un simple .toLowerCase() y por eso no encontraban
// resultados reales que sí existían, solo porque el usuario escribió el
// destino sin la tilde que sí tiene el dato guardado.
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
