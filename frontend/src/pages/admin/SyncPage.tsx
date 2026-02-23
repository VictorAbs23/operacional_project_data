import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/languageStore';
import { syncApi } from '../../services/sync.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from '../../components/ui/Toast';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';

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
    { key: 'error', header: t('common.error'), render: (item: any) => item.error ? <span className="text-error text-xs">{item.error}</span> : '—' },
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
