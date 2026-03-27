type ProductFiltersBarProps = {
  search: string
  category: string
  status: string
  categories: string[]
  total: number
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function ProductFiltersBar({
  search,
  category,
  status,
  categories,
  total,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: ProductFiltersBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Lista prodotti</h2>
          <p className="mt-1 text-sm text-white/55">Cerca rapidamente i prodotti e filtra solo per categoria o stato.</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">{total} elementi</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          className="shop-input xl:col-span-2"
          placeholder="Cerca per titolo"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <select className="shop-select" value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="">Tutte le categorie</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="shop-select" value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="all">Tutti gli stati</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="hidden">Hidden</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>
    </div>
  )
}
