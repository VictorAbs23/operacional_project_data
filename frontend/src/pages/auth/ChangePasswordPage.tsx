import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@absolutsport/shared';
import { authApi } from '../../services/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { ToastProvider } from '../../components/ui/Toast';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const t = useLanguageStore((s) => s.t);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      await authApi.changePassword(data);
      if (user) {
        updateUser({ ...user, mustChangePassword: false });
      }
      toast('success', t('auth.changePassword.success'));
      setTimeout(() => {
        navigate(user?.role === 'CLIENT' ? '/client' : '/admin');
      }, 1000);
    } catch {
      toast('error', t('common.error'));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-2">
            {t('auth.changePassword.title')}
          </h2>

          {user?.mustChangePassword && (
            <p className="text-sm text-warning mb-4">
              {t('auth.changePassword.required')}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('auth.changePassword.current')}
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <Input
              label={t('auth.changePassword.new')}
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label={t('auth.changePassword.confirm')}
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              {t('auth.changePassword.submit')}
            </Button>
          </form>
        </div>
      </div>
      <ToastProvider />
    </div>
  );
}
