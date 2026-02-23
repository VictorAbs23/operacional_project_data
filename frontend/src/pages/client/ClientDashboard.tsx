import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../stores/languageStore';
import { useAuthStore } from '../../stores/authStore';
import { formsApi } from '../../services/forms.api';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { FileText, Calendar, ChevronRight, Trophy } from 'lucide-react';
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

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          {t('client.welcome')}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-neutral-500 mt-1">{t('client.dashboard.subtitle')}</p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
        {(!proposals || proposals.length === 0) ? (
          <Card className="text-center py-12">
            <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">{t('common.noResults')}</p>
          </Card>
        ) : (
          proposals.map((p: any) => (
            <motion.div key={p.accessId} variants={itemVariants}>
              <div
                onClick={() => navigate(`/client/proposal/${p.accessId}`)}
                className="bg-white rounded-xl border border-neutral-200 shadow-md p-5 cursor-pointer hover:shadow-lg hover:translate-y-[-1px] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary-50">
                        <Trophy className="h-5 w-5 text-primary-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900">{p.game}</h3>
                      <StatusBadge status={p.captureStatus} />
                    </div>
                    <p className="text-sm text-neutral-500 ml-12">{p.hotel}</p>
                    <div className="flex items-center gap-4 mt-3 ml-12">
                      <span className="text-sm text-neutral-700">
                        {t('proposals.forms')}: {p.filledSlots} / {p.totalSlots}
                      </span>
                      {p.deadline && (
                        <span className="flex items-center gap-1 text-sm text-neutral-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {t('client.proposal.deadline')}: {dayjs(p.deadline).format('DD/MM/YYYY')}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 ml-12 max-w-xs">
                      <ProgressBar value={p.progressPercent} size="sm" />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-400" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
