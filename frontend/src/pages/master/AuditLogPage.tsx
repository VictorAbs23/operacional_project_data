import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/languageStore';
import { auditApi } from '../../services/audit.api';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import dayjs from 'dayjs';

export function AuditLogPage() {
  const t = useLanguageStore((s) => s.t);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditApi.list({ page, pageSize: 30 }),
  });

  const columns = [
    { key: 'timestamp', header: t('audit.timestamp'), render: (item: any) => (
      <span className="text-xs font-mono">{dayjs(item.timestamp).format('DD/MM/YY HH:mm:ss')}</span>
    )},
    { key: 'user', header: t('audit.user'), render: (item: any) => (
      <span className="text-sm">{item.user?.name || item.userId || '—'}</span>
    )},
    { key: 'action', header: t('audit.action'), render: (item: any) => (
      <Badge variant="info">{item.action}</Badge>
    )},
    { key: 'entity', header: t('audit.entity'), render: (item: any) => (
      <span className="text-sm text-neutral-500">{item.entity || '—'}{item.entityId ? ` #${item.entityId.slice(0,8)}` : ''}</span>
    )},
    { key: 'ipAddress', header: t('audit.ip'), render: (item: any) => (
      <span className="text-xs font-mono text-neutral-400">{item.ipAddress || '—'}</span>
    )},
  ];

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-6">{t('audit.title')}</h1>

      {isLoading ? <Spinner className="mt-10" /> : (
        <Table columns={columns} data={data?.data ?? []} emptyMessage={t('common.noResults')} />
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded bg-neutral-100 text-sm disabled:opacity-50">{t('common.prev')}</button>
          <span className="text-sm text-neutral-500">{t('common.page')} {page} {t('common.of')} {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded bg-neutral-100 text-sm disabled:opacity-50">{t('common.next')}</button>
        </div>
      )}
    </div>
  );
}
