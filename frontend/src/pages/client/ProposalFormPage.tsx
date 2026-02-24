import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/languageStore';
import { formsApi } from '../../services/forms.api';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft, User, CheckCircle, DoorOpen, ChevronRight, Trophy, Hotel } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProposalFormPage() {
  const { accessId } = useParams<{ accessId: string }>();
  const navigate = useNavigate();
  const t = useLanguageStore((s) => s.t);

  const { data, isLoading } = useQuery({
    queryKey: ['form-instance', accessId],
    queryFn: () => formsApi.getFormInstance(accessId!),
    enabled: !!accessId,
  });

  if (isLoading) return <Spinner className="mt-20" />;
  if (!data) return <p className="text-center text-neutral-500 mt-20">{t('common.noResults')}</p>;

  const rooms = data.slots?.reduce((acc: any, slot: any) => {
    if (!acc[slot.roomLabel]) acc[slot.roomLabel] = [];
    acc[slot.roomLabel].push(slot);
    return acc;
  }, {} as Record<string, any[]>) || {};

  const percent = data.totalSlots ? Math.round((data.filledSlots / data.totalSlots) * 100) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate('/client')}
        className="group flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        {t('client.dashboard.title')}
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-md p-5 md:p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-primary-50 shrink-0">
            <Trophy className="h-6 w-6 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-neutral-900 truncate">
              {data.game || t('client.proposal.title')}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-neutral-500">
              <Hotel className="h-4 w-4 shrink-0" />
              <span className="text-sm truncate">{data.hotel}</span>
            </div>
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-neutral-700">
                  {data.filledSlots} / {data.totalSlots} {t('proposals.forms')}
                </span>
                <span className="text-sm font-semibold text-primary-600">{percent}%</span>
              </div>
              <ProgressBar value={percent} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Room sections */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        {Object.entries(rooms).map(([roomLabel, slots]: [string, any]) => (
          <motion.div key={roomLabel} variants={itemVariants}>
            {/* Room header with divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 rounded-lg bg-primary-50">
                <DoorOpen className="h-4 w-4 text-primary-500" />
              </div>
              <h3 className="text-base font-display font-semibold text-neutral-900 whitespace-nowrap">
                {t('client.proposal.room')} — {roomLabel}
              </h3>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            {/* Passenger cards */}
            <div className="space-y-3">
              {slots.map((slot: any) => (
                <div
                  key={slot.id}
                  onClick={() => navigate(`/client/proposal/${accessId}/passenger/${slot.id}`)}
                  className="group flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 shadow-sm cursor-pointer hover:shadow-md hover:border-primary-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full transition-all ${
                      slot.status === 'FILLED'
                        ? 'bg-accent-50 text-accent-500'
                        : 'bg-neutral-100 text-neutral-400 group-hover:bg-primary-50 group-hover:text-primary-500'
                    }`}>
                      {slot.status === 'FILLED'
                        ? <CheckCircle className="h-4.5 w-4.5" />
                        : <User className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {t('client.proposal.passenger')} {slot.slotIndex + 1}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {slot.passengerName || t('client.proposal.pending')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={slot.status === 'FILLED' ? 'completed' : 'notStarted'}>
                      {slot.status === 'FILLED' ? t('client.proposal.filled') : t('client.proposal.pending')}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
