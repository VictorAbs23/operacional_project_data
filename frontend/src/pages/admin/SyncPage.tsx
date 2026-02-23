import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/languageStore';
import { syncApi } from '../../services/sync.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from '../../components/ui/Toast';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import dayjs from 'dayjs';

function ErrorCell({ error }: { error: string }) {
  const [expanded, setExpanded] = useState(false);

  // Extract the meaningful part of the error (after the last arrow or "Can't reach...")
  const short = error.includes("Can't reach database")
    ? "Can't reach database server"
    : error.length > 80
      ? error.slice(0, 80) + '…'
      : error;

  return (
    <div className="max-w-[260px]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-left text-xs text-error hover:text-red-700 transition-colors"
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span className={expanded ? '' : 'line-clamp-2'}>{expanded ? error : short}</span>
      </button>
    </div>
  );
}

export function SyncPage() {
  const t = useLanguageStore((s) => s.t);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: () => syncApi.getLogs(1, 20),
    refetchInterval: 10000,
  });

  const syncMutation = useMutation({
    mutationFn: syncApi.triggerSync,
    onSuccess: (data: any) => {
      const msg = data?.rowsUpserted != null
        ? `${t('sync.triggered')} — ${data.rowsRead} ${t('sync.rowsRead').toLowerCase()}, ${data.rowsUpserted} ${t('sync.rowsUpserted').toLowerCase()}`
        : t('sync.triggered');
      toast('success', msg);
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => toast('error', t('sync.failed')),
  });

  const columns = [
    { key: 'startedAt', header: t('sync.lastSync'), render: (item: any) => dayjs(item.startedAt).format('DD/MM/YYYY HH:mm:ss') },
    { key: 'status', header: t('sync.status'), render: (item: any) => (
      <Badge variant={item.status === 'SUCCESS' ? 'completed' : item.status === 'ERROR' ? 'expired' : item.status === 'PARTIAL' ? 'inProgress' : 'inProgress'}>
        {item.status}
      </Badge>
    )},
    { key: 'rowsRead', header: t('sync.rowsRead') },
    { key: 'rowsUpserted', header: t('sync.rowsUpserted') },
    { key: 'rowsSkipped', header: t('sync.rowsSkipped') },
    { key: 'error', header: t('common.error'), render: (item: any) => item.error ? <ErrorCell error={item.error} /> : '—' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-neutral-900">{t('sync.title')}</h1>
        <Button onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" /> {t('sync.trigger')}
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="mt-10" />
      ) : (
        <Table columns={columns} data={data?.data ?? []} emptyMessage={t('common.noResults')} />
      )}
    </div>
  );
}
