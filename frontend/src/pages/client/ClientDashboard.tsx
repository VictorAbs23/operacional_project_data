import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../stores/languageStore';
import { useAuthStore } from '../../stores/authStore';
import { formsApi } from '../../services/forms.api';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { FileText, Calendar, ChevronRight, Trophy, Hotel } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

export function ClientDashboard() {
  const t = useLanguageStore((s) => s.t);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['client-proposals'],
    queryFn: formsApi.getClientProposals,
  });

  if (isLoading) return <Spinner className="mt-20" />;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const getAccentColor = (percent: number) => {
    if (percent >= 100) return 'bg-accent-500';
    if (percent > 0) return 'bg-primary-500';
    return 'bg-neutral-300';
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-500 to-primary-700 p-6 md:p-8 mb-8 shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
        {/* Watermark logo */}
        <img
          src="/Logo_Absolut_Sport_Preto_e_Azul.svg"
          alt=""
          className="absolute right-4 top-1/2 -translate-y-1/2 h-24 md:h-32 opacity-[0.08] brightness-0 invert pointer-events-none select-none"
        />
        <div className="relative z-10">
          <p className="text-primary-200 text-sm font-medium tracking-wide uppercase mb-1">
            {t('client.portalTitle')}
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
            {t('client.welcome')}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-primary-100 mt-1">{t('client.dashboard.subtitle')}</p>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
        {(!proposals || proposals.length === 0) ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-neutral-400" />
            </div>
            <p className="text-lg font-medium text-neutral-600 mb-1">{t('common.noResults')}</p>
            <p className="text-sm text-neutral-400">{t('client.dashboard.subtitle')}</p>
          </div>
        ) : (
          proposals.map((p: any) => {
            const percent = p.progressPercent ?? (p.totalSlots ? Math.round((p.filledSlots / p.totalSlots) * 100) : 0);
            return (
              <motion.div key={p.accessId} variants={itemVariants}>
                <div
                  onClick={() => navigate(`/client/proposal/${p.accessId}`)}
                  className="group relative bg-white rounded-xl border border-neutral-200 shadow-md overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all"
                >
                  {/* Colored accent bar */}
                  <div className={`h-1 ${getAccentColor(percent)}`} />

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Game title */}
                        <div className="flex items-center gap-3 mb-1">
                          <div className="p-2 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors shrink-0">
                            <Trophy className="h-5 w-5 text-primary-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-neutral-900 truncate">{p.game}</h3>
                        </div>

                        {/* Hotel */}
                        <div className="flex items-center gap-2 ml-12 mb-3">
                          <Hotel className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                          <p className="text-sm text-neutral-500 truncate">{p.hotel || t('proposals.noHotel')}</p>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-4 ml-12 flex-wrap">
                          <StatusBadge status={p.captureStatus} />
                          <span className="text-sm text-neutral-700 font-medium">
                            {p.filledSlots} / {p.totalSlots} {t('proposals.forms')}
                          </span>
                          {p.deadline && (
                            <span className="flex items-center gap-1 text-sm text-neutral-500">
                              <Calendar className="h-3.5 w-3.5" />
                              {dayjs(p.deadline).format('DD/MM/YYYY')}
                            </span>
                          )}
                        </div>

                        {/* Full-width progress bar */}
                        <div className="mt-3 ml-12">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 mr-3">
                              <ProgressBar value={percent} size="sm" />
                            </div>
                            <span className="text-xs font-medium text-neutral-500 shrink-0">{percent}%</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
