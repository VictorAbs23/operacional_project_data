import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../stores/languageStore';
import { clientsApi } from '../../services/clients.api';
import { Table } from '../../components/ui/Table';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function ClientsPage() {
  const t = useLanguageStore((s) => s.t);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => clientsApi.list(page, 20, search || undefined),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => clientsApi.resetPassword(id),
    onSuccess: (result) => {
      setTempPassword(result.tempPassword);
      toast('success', t('common.success'));
    },
    onError: () => toast('error', t('common.error')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => clientsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast('success', t('common.success'));
    },
    onError: () => toast('error', t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast('success', t('common.success'));
    },
    onError: () => toast('error', t('common.error')),
  });

  const columns = [
    { key: 'name', header: t('clients.name') },
    { key: 'email', header: t('clients.email'), className: 'font-mono text-sm' },
    {
      key: 'totalProposals',
      header: t('clients.proposals'),
      render: (item: any) => (
        <span className="text-sm font-medium">{item.totalProposals}</span>
      ),
    },
    {
      key: 'forms',
      header: t('clients.forms'),
      render: (item: any) => (
        <span className="text-sm font-medium">{item.filledSlots} / {item.totalSlots}</span>
      ),
    },
    {
      key: 'progress',
      header: t('clients.progress'),
      render: (item: any) => (
        <div className="w-24">
          <ProgressBar value={item.progressPercent} size="sm" />
        </div>
      ),
    },
    {
      key: 'isActive',
      header: t('clients.active'),
      render: (item: any) => (
        <Badge variant={item.isActive ? 'completed' : 'expired'}>
          {item.isActive ? t('clients.active') : t('clients.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); resetMutation.mutate(item.id); }}
            className="text-xs text-primary-500 hover:underline"
          >
            {t('clients.resetPassword')}
          </button>
          {item.isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); deactivateMutation.mutate(item.id); }}
              className="text-xs text-error hover:underline"
            >
              {t('clients.deactivate')}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); if (window.confirm(t('common.confirmDelete'))) deleteMutation.mutate(item.id); }}
            className="text-xs text-error hover:underline"
          >
            {t('common.delete')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-6">{t('clients.title')}</h1>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder={t('clients.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-base pl-10"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        onRowClick={(item) => navigate(`/admin/clients/${item.id}`)}
        emptyMessage={t('common.noResults')}
        loading={isLoading}
      />

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: data.totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                page === i + 1
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Temp Password Modal */}
      <Modal open={!!tempPassword} onClose={() => setTempPassword(null)} title={t('users.tempPassword')}>
        <div className="text-center">
          <p className="text-sm text-neutral-500 mb-4">{t('users.tempPasswordShare')}</p>
          <p className="text-2xl font-mono font-bold text-primary-500 bg-primary-50 px-4 py-3 rounded-lg select-all">{tempPassword}</p>
          <p className="text-xs text-neutral-400 mt-3">{t('users.tempPasswordNote')}</p>
        </div>
      </Modal>
    </motion.div>
  );
}
