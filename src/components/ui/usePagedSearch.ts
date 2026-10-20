import { useEffect, useState } from "react";

export const LIST_PAGE_SIZE = 50;

/** O campo responde imediatamente; apenas a consulta aguarda a digitação. */
export function usePagedSearch() {
  const [search, setSearch] = useState("");
  const [request, setRequest] = useState({ query: "", page: 0 });
  useEffect(() => {
    const timer = setTimeout(() => {
      setRequest((current) => current.query === search.trim() ? current : { query: search.trim(), page: 0 });
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  return {
    search, setSearch, query: request.query, page: request.page,
    setPage: (page: number) => setRequest((current) => ({ ...current, page: Math.max(0, page) })),
  };
}
