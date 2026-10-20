import { Button } from "./controls";

export function ListPagination({ page, count, hasNext, loading, onChange }: {
  page: number; count: number; hasNext: boolean; loading: boolean; onChange: (page: number) => void;
}) {
  return <nav aria-label="Paginação da lista" className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <span className="text-mute">Página {page + 1} · {count} registro{count !== 1 ? "s" : ""} nesta página</span>
    <div className="flex gap-2">
      <Button variant="ghost" disabled={loading || page === 0} onClick={() => onChange(page - 1)}>Anterior</Button>
      <Button variant="ghost" disabled={loading || !hasNext} onClick={() => onChange(page + 1)}>Próxima</Button>
    </div>
  </nav>;
}
