import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../stores/languageStore';
import { dashboardApi } from '../../services/dashboard.api';
import { proposalsApi } from '../../services/proposals.api';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Table } from '../../components/ui/Table';
import { Spinner } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Send, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function DashboardPage() {
  const t = useLanguageStore((s) => s.t);
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals', { page: 1, pageSize: 10 }],
    queryFn: () => proposalsApi.list({ page: 1, pageSize: 10 }),
  });

  if (statsLoading) return <Spinner className="mt-20" />;

  const statCards = [
    { label: t('dashboard.totalDispatched'), value: stats?.totalDispatched ?? 0, icon: Send, gradient: 'from-primary-500 to-primary-600', bg: 'bg-primary-50' },
    { label: t('dashboard.notStarted'), value: stats?.notStarted ?? 0, icon: Clock, gradient: 'from-neutral-400 to-neutral-500', bg: 'bg-neutral-100' },
    { label: t('dashboard.inProgress'), value: stats?.inProgress ?? 0, icon: PlayCircle, gradient: 'from-amber-400 to-amber-500', bg: 'bg-amber-50' },
    { label: t('dashboard.completed'), value: stats?.completed ?? 0, icon: CheckCircle2, gradient: 'from-accent-500 to-accent-600', bg: 'bg-accent-50' },
  ];

  // Status breakdown data
  const total = (stats?.notStarted ?? 0) + (stats?.inProgress ?? 0) + (stats?.completed ?? 0);
  const breakdown = total > 0 ? [
    { label: t('status.completed'), value: stats?.completed ?? 0, pct: Math.round(((stats?.completed ?? 0) / total) * 100), color: 'bg-accent-500' },
    { label: t('status.inProgress'), value: stats?.inProgress ?? 0, pct: Math.round(((stats?.inProgress ?? 0) / total) * 100), color: 'bg-primary-500' },
    { label: t('status.notStarted'), value: stats?.notStarted ?? 0, pct: Math.round(((stats?.notStarted ?? 0) / total) * 100), color: 'bg-neutral-300' },
  ] : [];

  const columns = [
    { key: 'proposal', header: t('proposals.proposal'), className: 'font-mono text-primary-700 bg-primary-50/50 rounded px-1.5' },
    { key: 'clientName', header: t('proposals.client') },
    { key: 'game', header: t('proposals.game') },
    { key: 'hotel', header: t('proposals.hotel') },
    { key: 'forms', header: t('proposals.forms'), render: (item: any) => `${item.filledSlots} / ${item.totalSlots}` },
    { key: 'progress', header: t('proposals.progress'), render: (item: any) => <ProgressBar value={item.progressPercent} size="sm" /> },
    { key: 'status', header: t('proposals.status'), render: (item: any) => <StatusBadge status={item.captureStatus} /> },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-6">{t('dashboard.title')}</h1>

      {/* Stat cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((card) => (
          <motion.div key={card.label} variants={cardVariants}>
            <Card className="flex items-center gap-4 hover:shadow-lg hover:scale-[1.02] transition-all">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <div className={`p-1 rounded-lg bg-gradient-to-br ${card.gradient} text-white`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500">{card.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Global progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-700">{t('dashboard.globalProgress')}</h3>
          <span className="text-sm font-mono text-neutral-500">{stats?.globalProgress ?? 0}%</span>
        </div>
        <ProgressBar value={stats?.globalProgress ?? 0} showLabel={false} size="lg" />
      </Card>

      {/* Status breakdown */}
      {breakdown.length > 0 && (
        <Card className="mb-8">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('dashboard.progressBreakdown')}</h3>
          <div className="h-4 rounded-full overflow-hidden flex bg-neutral-100 mb-3">
            {breakdown.map((b) => (
              b.pct > 0 && (
                <div
                  key={b.label}
                  className={`${b.color} transition-all duration-500`}
                  style={{ width: `${b.pct}%` }}
                  title={`${b.label}: ${b.value}`}
                />
              )
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {breakdown.map((b) => (
              <span key={b.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                {b.label}: {b.value} ({b.pct}%)
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Proposals table */}
      <h2 className="text-xl font-display font-semibold text-neutral-900 mb-4">{t('dashboard.proposalsTable')}</h2>
      <Table
        columns={columns}
        data={proposals?.data ?? []}
        onRowClick={(item: any) => navigate(`/admin/proposals/${item.id}`)}
        emptyMessage={t('common.noResults')}
        loading={proposalsLoading}
      />
    </div>
  );
}
