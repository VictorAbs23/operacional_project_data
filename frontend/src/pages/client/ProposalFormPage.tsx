import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/languageStore';
import { formsApi } from '../../services/forms.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft, User, CheckCircle, DoorOpen, ChevronRight } from 'lucide-react';
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
      <button onClick={() => navigate('/client')} className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> {t('client.dashboard.title')}
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-neutral-900">{data.game || t('client.proposal.title')}</h1>
        <p className="text-neutral-500 mt-1">{data.hotel}</p>
        <ProgressBar value={data.filledSlots} max={data.totalSlots} size="md" className="mt-3 max-w-md" />
        <p className="text-xs text-neutral-400 mt-1">{data.filledSlots} / {data.totalSlots} {t('proposals.forms')}</p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {Object.entries(rooms).map(([roomLabel, slots]: [string, any]) => (
          <motion.div key={roomLabel} variants={itemVariants}>
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary-50">
                  <DoorOpen className="h-5 w-5 text-primary-500" />
                </div>
                <h3 className="text-lg font-display font-semibold text-neutral-900">
                  {t('client.proposal.room')} — {roomLabel}
                </h3>
              </div>
              <div className="space-y-3">
                {slots.map((slot: any) => (
                  <div
                    key={slot.id}
                    onClick={() => navigate(`/client/proposal/${accessId}/passenger/${slot.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full transition-colors ${slot.status === 'FILLED' ? 'bg-accent-50 text-accent-500' : 'bg-neutral-100 text-neutral-400'}`}>
                        {slot.status === 'FILLED' ? <CheckCircle className="h-4 w-4" /> : <User className="h-4 w-4" />}
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
                      <ChevronRight className="h-4 w-4 text-neutral-300" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
