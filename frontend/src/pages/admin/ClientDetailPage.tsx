import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/languageStore';
import { clientsApi } from '../../services/clients.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../components/ui/Toast';
import { motion } from 'framer-motion';
import {
  ChevronRight, FileText, CheckCircle2,
  Clock, AlertCircle, RotateCcw, UserX, Trash2,
} from 'lucide-react';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useLanguageStore((s) => s.t);
  const queryClient = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  });

  const resetMutation = useMutation({
    mutationFn: () => clientsApi.resetPassword(id!),
    onSuccess: (result) => {
      setTempPassword(result.tempPassword);
      toast('success', t('common.success'));
    },
    onError: () => toast('error', t('common.error')),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => clientsApi.deactivate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast('success', t('common.success'));
    },
    onError: () => toast('error', t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.delete(id!),
    onSuccess: () => {
      toast('success', t('common.success'));
      navigate('/admin/clients');
    },
    onError: () => toast('error', t('common.error')),
  });

  if (isLoading) return <Spinner className="mt-20" />;
  if (!client) return <p className="text-center text-neutral-500 mt-20">{t('common.noResults')}</p>;

  const proposalColumns = [
    {
      key: 'proposal',
      header: t('proposals.proposal'),
      render: (item: any) => (
        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{item.proposal}</span>
      ),
    },
    { key: 'game', header: t('proposals.game') },
    { key: 'hotel', header: t('proposals.hotel') },
    { key: 'seller', header: t('clients.detail.seller') },
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
      key: 'captureStatus',
      header: t('proposals.status'),
      render: (item: any) => <StatusBadge status={item.captureStatus} />,
    },
    {
      key: 'deadline',
      header: t('clients.detail.deadline'),
      render: (item: any) => (
        <span className="text-sm text-neutral-500">
          {item.deadline ? new Date(item.deadline).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
        <button onClick={() => navigate('/admin/clients')} className="hover:text-primary-500 transition-colors">
          {t('clients.title')}
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-900 font-medium">{client.name}</span>
      </div>

      {/* Profile header */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar src={client.profilePhotoUrl} name={client.name} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-neutral-900">{client.name}</h1>
              <Badge variant={client.isActive ? 'completed' : 'expired'}>
                {client.isActive ? t('clients.active') : t('clients.inactive')}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500 font-mono">{client.email}</p>
            <p className="text-xs text-neutral-400 mt-1">
              {t('clients.detail.since')} {new Date(client.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetMutation.mutate()}
              loading={resetMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> {t('clients.resetPassword')}
            </Button>
            {client.isActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deactivateMutation.mutate()}
                loading={deactivateMutation.isPending}
              >
                <UserX className="h-4 w-4 mr-2" /> {t('clients.deactivate')}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (window.confirm(t('common.confirmDelete'))) deleteMutation.mutate(); }}
              loading={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" /> {t('common.delete')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50">
            <FileText className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">{t('clients.detail.totalProposals')}</p>
            <p className="text-xl font-bold text-neutral-900">{client.stats.totalProposals}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-50">
            <CheckCircle2 className="h-5 w-5 text-accent-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">{t('clients.detail.filledSlots')}</p>
            <p className="text-xl font-bold text-neutral-900">{client.stats.filledSlots} / {client.stats.totalSlots}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-100">
            <Clock className="h-5 w-5 text-neutral-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">{t('clients.detail.globalProgress')}</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-neutral-900">{client.stats.progressPercent}%</p>
              <div className="w-16"><ProgressBar value={client.stats.progressPercent} size="sm" /></div>
            </div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <AlertCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">{t('clients.detail.completedProposals')}</p>
            <p className="text-xl font-bold text-neutral-900">{client.stats.completedProposals}</p>
          </div>
        </Card>
      </div>

      {/* Proposals table */}
      <h3 className="text-lg font-display font-semibold text-neutral-900 mb-3">
        {t('clients.detail.proposalsTable')}
      </h3>
      <Table
        columns={proposalColumns}
        data={client.proposals}
        emptyMessage={t('common.noResults')}
      />

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
