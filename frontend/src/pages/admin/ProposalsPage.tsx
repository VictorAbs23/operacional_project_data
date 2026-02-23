import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../stores/languageStore';
import { proposalsApi } from '../../services/proposals.api';
import { Table } from '../../components/ui/Table';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_OPTIONS = [
  { value: 'AWAITING_FILL', i18n: 'status.notStarted', color: 'bg-neutral-100 text-neutral-700' },
  { value: 'IN_PROGRESS', i18n: 'status.inProgress', color: 'bg-primary-50 text-primary-700' },
  { value: 'COMPLETED', i18n: 'status.completed', color: 'bg-accent-50 text-accent-700' },
  { value: 'EXPIRED', i18n: 'status.expired', color: 'bg-red-50 text-red-700' },
];

export function ProposalsPage() {
  const t = useLanguageStore((s) => s.t);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', status: '', game: '', hotel: '', seller: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', filters],
    queryFn: () => proposalsApi.list(filters),
  });

  const toggleStatus = (value: string) => {
    setFilters((f) => ({
      ...f,
      status: f.status === value ? '' : value,
      page: 1,
    }));
  };

  const columns = [
    {
      key: 'proposal',
      header: t('proposals.proposal'),
      render: (item: any) => (
        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{item.proposal}</span>
      ),
    },
    { key: 'clientName', header: t('proposals.client') },
    { key: 'game', header: t('proposals.game') },
    { key: 'hotel', header: t('proposals.hotel') },
    {
      key: 'forms',
      header: t('proposals.forms'),
      render: (item: any) => (
        <span className="text-sm font-medium">{item.filledSlots} / {item.totalSlots}</span>
      ),
    },
    {
      key: 'progress',
      header: '%',
      render: (item: any) => (
        <div className="w-24">
          <ProgressBar value={item.progressPercent} size="sm" />
        </div>
      ),
    },
    {
      key: 'status',
      header: t('proposals.status'),
      render: (item: any) => <StatusBadge status={item.captureStatus} />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-6">{t('proposals.title')}</h1>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder={t('common.search') + '...'}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="input-base pl-10"
        />
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleStatus(opt.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filters.status === opt.value
                ? `${opt.color} border-current ring-2 ring-current/10`
                : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {t(opt.i18n)}
            {filters.status === opt.value && <X className="h-3 w-3" />}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        onRowClick={(item: any) => navigate(`/admin/proposals/${item.id}`)}
        emptyMessage={t('common.noResults')}
        loading={isLoading}
      />

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: data.totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setFilters({ ...filters, page: i + 1 })}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                filters.page === i + 1
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
