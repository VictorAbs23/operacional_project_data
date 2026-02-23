import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserInput, Role } from '@absolutsport/shared';
import { useLanguageStore } from '../../stores/languageStore';
import { usersApi } from '../../services/users.api';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from '../../components/ui/Toast';
import { Plus, RotateCcw } from 'lucide-react';

export function UsersPage() {
  const t = useLanguageStore((s) => s.t);
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(1, 50),
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      if (result.tempPassword) {
        setTempPassword(result.tempPassword);
      }
      toast('success', t('common.success'));
    },
    onError: () => toast('error', t('common.error')),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
    onSuccess: (result) => {
      setTempPassword(result.tempPassword);
      toast('success', t('common.success'));
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('success', t('common.success'));
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: Role.ADMIN },
  });

  const columns = [
    { key: 'name', header: t('users.name') },
    { key: 'email', header: t('users.email'), className: 'font-mono text-sm' },
    { key: 'role', header: t('users.role'), render: (item: any) => <Badge variant={item.role === 'MASTER' ? 'info' : 'active'}>{item.role}</Badge> },
    { key: 'isActive', header: t('users.active'), render: (item: any) => <Badge variant={item.isActive ? 'completed' : 'expired'}>{item.isActive ? 'Yes' : 'No'}</Badge> },
    { key: 'actions', header: '', render: (item: any) => (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); resetMutation.mutate(item.id); }} className="text-xs text-primary-500 hover:underline">
          {t('users.resetPassword')}
        </button>
        {item.isActive && (
          <button onClick={(e) => { e.stopPropagation(); deactivateMutation.mutate(item.id); }} className="text-xs text-error hover:underline">
            {t('users.deactivate')}
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-neutral-900">{t('users.title')}</h1>
        <Button onClick={() => { reset(); setShowCreateModal(true); }}>
          <Plus className="h-4 w-4 mr-2" /> {t('users.create')}
        </Button>
      </div>

      {isLoading ? <Spinner className="mt-10" /> : (
        <Table columns={columns} data={data?.data ?? []} emptyMessage={t('common.noResults')} />
      )}

      {/* Create User Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('users.create')}>
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <Input label={t('users.name')} error={errors.name?.message} {...register('name')} />
          <Input label={t('users.email')} type="email" error={errors.email?.message} {...register('email')} />
          <Select
            label={t('users.role')}
            options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'MASTER', label: 'Master' }]}
            {...register('role')}
          />
          <Button type="submit" loading={createMutation.isPending} className="w-full">
            {t('users.create')}
          </Button>
        </form>
      </Modal>

      {/* Temp Password Modal */}
      <Modal open={!!tempPassword} onClose={() => setTempPassword(null)} title={t('users.tempPassword')}>
        <div className="text-center">
          <p className="text-sm text-neutral-500 mb-4">{t('users.tempPasswordShare')}</p>
          <p className="text-2xl font-mono font-bold text-primary-500 bg-primary-50 px-4 py-3 rounded-lg select-all">{tempPassword}</p>
          <p className="text-xs text-neutral-400 mt-3">{t('users.tempPasswordNote')}</p>
        </div>
      </Modal>
    </div>
  );
}
