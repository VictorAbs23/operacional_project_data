interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-neutral-100">
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function Table<T extends Record<string, unknown>>({ columns, data, onRowClick, emptyMessage = 'No data', loading }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-10">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 text-left font-semibold text-neutral-700 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} cols={columns.length} />)
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-neutral-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-neutral-100 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary-50/50' : ''} ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
