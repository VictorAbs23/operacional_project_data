import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@absolutsport/shared';
import { authApi } from '../../services/auth.api';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { LanguageToggle } from '../../components/shared/LanguageToggle';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const t = useLanguageStore((s) => s.t);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      const result = await authApi.login(data);
      setAuth(result.token, result.user);

      if (result.user.mustChangePassword) {
        navigate('/change-password');
      } else if (result.user.role === 'CLIENT') {
        navigate('/client');
      } else {
        navigate('/admin');
      }
    } catch {
      setError(t('auth.login.error'));
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
          {/* Logo / Brand */}
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

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-xl border border-neutral-100 p-8">
            <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-6">
              {t('auth.login.title')}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label={t('auth.password')}
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <Button type="submit" loading={isSubmitting} className="w-full shadow-primary">
                {t('auth.login')}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-neutral-400 mt-6 font-display">
            World Cup 2026 &mdash; Data Collection Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
