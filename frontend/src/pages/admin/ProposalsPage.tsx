import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../stores/languageStore';
import { proposalsApi } from '../../services/proposals.api';
import { Table } from '../../components/ui/Table';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Combobox } from '../../components/ui/Combobox';
import { Pagination } from '../../components/ui/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, X, FileX } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_OPTIONS = [
  { value: 'NOT_DISPATCHED', i18n: 'status.pending', color: 'bg-amber-50 text-amber-700' },
  { value: 'AWAITING_FILL', i18n: 'status.notStarted', color: 'bg-neutral-100 text-neutral-700' },
  { value: 'IN_PROGRESS', i18n: 'status.inProgress', color: 'bg-primary-50 text-primary-700' },
  { value: 'COMPLETED', i18n: 'status.completed', color: 'bg-accent-50 text-accent-700' },
  { value: 'EXPIRED', i18n: 'status.expired', color: 'bg-red-50 text-red-700' },
];

export function ProposalsPage() {
  const t = useLanguageStore((s) => s.t);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', status: '', game: '', hotel: '', seller: '', page: 1 });

  const debouncedSearch = useDebounce(filters.search, 300);

  const queryFilters = { ...filters, search: debouncedSearch };

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', queryFilters],
    queryFn: () => {
      const cleanFilters = Object.fromEntries(
        Object.entries(queryFilters).filter(([_, v]) => v !== '' && v !== undefined)
      );
      return proposalsApi.list(cleanFilters);
    },
    placeholderData: keepPreviousData,
  });

  const filterContext = { game: filters.game, hotel: filters.hotel, seller: filters.seller };

  const { data: filterOptions } = useQuery({
    queryKey: ['proposals-filter-options', filterContext],
    queryFn: () => proposalsApi.filterOptions(
      Object.fromEntries(Object.entries(filterContext).filter(([_, v]) => v !== ''))
    ),
    staleTime: 30 * 1000,
  });

  const toggleStatus = (value: string) => {
    setFilters((f) => ({
      ...f,
      status: f.status === value ? '' : value,
      page: 1,
    }));
  };

  const updateFilter = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const clearAllFilters = () => {
    setFilters({ search: '', status: '', game: '', hotel: '', seller: '', page: 1 });
  };

  const activeFilterPills = [
    filters.game && { key: 'game', label: `${t('proposals.game')}: ${filters.game}` },
    filters.hotel && { key: 'hotel', label: `${t('proposals.hotel')}: ${filters.hotel}` },
    filters.seller && { key: 'seller', label: `${t('proposals.seller')}: ${filters.seller}` },
  ].filter(Boolean) as { key: string; label: string }[];

  const hasActiveFilters = filters.search || filters.status || filters.game || filters.hotel || filters.seller;

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
    {
      key: 'hotel',
      header: t('proposals.hotel'),
      render: (item: any) => item.hotel || <span className="text-neutral-400 italic">{t('proposals.noHotel')}</span>,
    },
    {
      key: 'saleStatus',
      header: t('proposals.saleStatus'),
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      key: 'forms',
      header: t('proposals.forms'),
      render: (item: any) => {
        const total = item.totalSlots > 0 ? item.totalSlots : item.totalPax;
        return <span className="text-sm font-medium">{item.filledSlots} / {total}</span>;
      },
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
      key: 'captureStatus',
      header: t('proposals.captureStatus'),
      render: (item: any) => <StatusBadge status={item.captureStatus} />,
    },
  ];

  const isEmpty = !isLoading && data?.data?.length === 0;

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
          placeholder={t('proposals.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="input-base pl-10"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Combobox
          options={filterOptions?.games ?? []}
          value={filters.game}
          onChange={(v) => updateFilter('game', v)}
          placeholder={t('proposals.allGames')}
        />
        <Combobox
          options={filterOptions?.hotels ?? []}
          value={filters.hotel}
          onChange={(v) => updateFilter('hotel', v)}
          placeholder={t('proposals.allHotels')}
        />
        <Combobox
          options={filterOptions?.sellers ?? []}
          value={filters.seller}
          onChange={(v) => updateFilter('seller', v)}
          placeholder={t('proposals.allSellers')}
        />
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Active filter pills */}
      {(activeFilterPills.length > 0 || (hasActiveFilters && activeFilterPills.length === 0)) && activeFilterPills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {activeFilterPills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium"
            >
              {pill.label}
              <button onClick={() => updateFilter(pill.key, '')} className="hover:text-primary-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-2"
          >
            {t('proposals.clearFilters')}
          </button>
        </div>
      )}

      {/* Results counter */}
      {data && !isEmpty && (
        <p className="text-xs text-neutral-500 mb-3">
          {t('common.showing')} {data.data.length} {t('common.of')} {data.total} {t('common.results')}
        </p>
      )}

      {/* Table or empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <FileX className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium text-neutral-500 mb-1">{t('common.noResults')}</p>
          <p className="text-xs mb-4">{t('proposals.tryDifferentFilters')}</p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
            >
              {t('proposals.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <Table
          columns={columns}
          data={data?.data ?? []}
          onRowClick={(item: any) => navigate(`/admin/proposals/${item.id}`)}
          emptyMessage={t('common.noResults')}
          loading={isLoading}
        />
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Pagination
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(p) => setFilters({ ...filters, page: p })}
          total={data.total}
          pageSize={data.pageSize}
        />
      )}
    </motion.div>
  );
}
