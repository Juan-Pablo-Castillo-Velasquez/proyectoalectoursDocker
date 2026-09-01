"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Hook de paginación reutilizable. Recibe la lista ya filtrada y el tamaño de
 * página, y devuelve: la sublista a mostrar, la página actual (base 0), el
 * total de páginas y el setter de página (con reinicio automático si la lista
 * se achica y la página actual queda fuera de rango).
 */
export function usePagination<T>(items: T[], pageSize = 8) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  const slice = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize],
  );

  return { page: safePage, pageCount, slice, setPage };
}
