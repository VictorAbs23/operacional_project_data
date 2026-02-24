import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@absolutsport/shared';
import { authApi } from '../../services/auth.api';
import { useLanguageStore } from '../../stores/languageStore';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';

export function ForgotPasswordPage() {
  const t = useLanguageStore((s) => s.t);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      await authApi.forgotPassword(data);
    } catch {
      // Always show success message — anti-enumeration
    }
    setSubmitted(true);
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
            <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-2">
              {t('auth.forgotPassword.title')}
            </h2>

            {submitted ? (
              <div className="mt-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {t('auth.forgotPassword.success')}
                </div>
                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="text-sm text-primary-500 hover:text-primary-700 transition-colors"
                  >
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-neutral-500 mb-6">
                  {t('auth.forgotPassword.description')}
                </p>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label={t('auth.email')}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Button type="submit" loading={isSubmitting} className="w-full shadow-primary">
                    {t('auth.forgotPassword.submit')}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <Link
                    to="/login"
                    className="text-sm text-primary-500 hover:text-primary-700 transition-colors"
                  >
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-neutral-400 mt-6 font-display">
            World Cup 2026 &mdash; Data Collection Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
