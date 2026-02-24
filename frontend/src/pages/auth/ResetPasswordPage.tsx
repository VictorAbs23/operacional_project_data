import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { resetPasswordSchema, type ResetPasswordInput } from '@absolutsport/shared';
import { authApi } from '../../services/auth.api';
import { useLanguageStore } from '../../stores/languageStore';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const t = useLanguageStore((s) => s.t);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(token ? '' : t('auth.resetPassword.invalidToken'));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setError('');
      await authApi.resetPassword({
        token: data.token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.code === 'INVALID_TOKEN') {
        setError(t('auth.resetPassword.invalidToken'));
      } else {
        setError(t('auth.login.networkError'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-50 flex flex-col">
      <div className="absolute top-4 right-4">
        <div className="bg-primary-900 rounded-lg p-1">
          <LanguageToggle />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <img
              src="/Logo_Absolut_Sport_Preto_e_Azul.svg"
              alt="AbsolutSport"
              className="h-16 mx-auto mb-4"
            />
            <p className="text-lg text-primary-500 font-display mt-1">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-xl border border-neutral-100 p-8">
            <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-6">
              {t('auth.resetPassword.title')}
            </h2>

            {success ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {t('auth.resetPassword.success')}
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
                      {error}
                    </div>
                    {error === t('auth.resetPassword.invalidToken') && (
                      <div className="mt-3 text-center">
                        <Link
                          to="/forgot-password"
                          className="text-sm text-primary-500 hover:text-primary-700 transition-colors"
                        >
                          {t('auth.resetPassword.requestNew')}
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...register('token')} />
                  <Input
                    label={t('auth.resetPassword.newPassword')}
                    type="password"
                    autoComplete="new-password"
                    error={errors.newPassword?.message}
                    {...register('newPassword')}
                  />
                  <Input
                    label={t('auth.resetPassword.confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                  <Button type="submit" loading={isSubmitting} className="w-full shadow-primary">
                    {t('auth.resetPassword.submit')}
                  </Button>
                </form>
              </>
            )}

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="text-sm text-primary-500 hover:text-primary-700 transition-colors"
              >
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-neutral-400 mt-6 font-display">
            World Cup 2026 &mdash; Data Collection Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
