import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/languageStore';
import { proposalsApi } from '../../services/proposals.api';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from '../../components/ui/Toast';
import { motion } from 'framer-motion';
import {
  Send, Link2, Grid3X3, Copy, Check,
  Download, ChevronRight, Calendar, Phone, Mail,
  Users, Hotel, Gamepad2, CheckCircle2, XCircle,
} from 'lucide-react';

interface DispatchResult {
  accessToken: string;
  clientLink: string;
  clientEmail: string;
  tempPassword?: string;
  emailSent: boolean;
}

export function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useLanguageStore((s) => s.t);
  const queryClient = useQueryClient();
  const [dispatchInfo, setDispatchInfo] = useState<DispatchResult | null>(null);
  const [copied, setCopied] = useState<'link' | 'email' | 'password' | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalsApi.getById(id!),
    enabled: !!id,
  });

  const { data: matrixRows } = useQuery({
    queryKey: ['proposal-matrix', id],
    queryFn: () => proposalsApi.getMatrix(id!),
    enabled: !!id,
  });

  const dispatchEmail = useMutation({
    mutationFn: () => proposalsApi.dispatch(proposal!.proposal, 'EMAIL'),
    onSuccess: (data: DispatchResult) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      setDispatchInfo(data);
      toast('success', data.emailSent ? t('proposals.emailSentSuccess') : t('common.success'));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || t('common.error');
      toast('error', msg);
    },
  });

  const dispatchLink = useMutation({
    mutationFn: () => proposalsApi.dispatch(proposal!.proposal, 'MANUAL_LINK'),
    onSuccess: (data: DispatchResult) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      setDispatchInfo(data);
      toast('success', t('common.success'));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || t('common.error');
      toast('error', msg);
    },
  });

  const copyToClipboard = (text: string, field: 'link' | 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExport = async (type: string) => {
    setExportOpen(false);
    try {
      const resp = await api.get('/exports', {
        params: { type, proposal: proposal?.proposal },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${proposal?.proposal || id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('error', t('common.error'));
    }
  };

  if (isLoading) return <Spinner className="mt-20" />;
  if (!proposal) return <p className="text-center text-neutral-500 mt-20">{t('common.noResults')}</p>;

  // Prerequisites per spec: STATUS must be CONFIRMED + EMAIL must exist
  const isConfirmed = proposal.status === 'CONFIRMED';
  const hasEmail = Boolean(proposal.clientEmail && proposal.clientEmail.trim());
  const canDispatch = isConfirmed && hasEmail;

  // Passenger overview from matrix
  const roomCounts: Record<string, number> = {};
  if (matrixRows) {
    for (const row of matrixRows) {
      roomCounts[row.roomLabel] = (roomCounts[row.roomLabel] || 0) + 1;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
        <button onClick={() => navigate('/admin')} className="hover:text-primary-500 transition-colors">Dashboard</button>
        <ChevronRight className="h-3 w-3" />
        <button onClick={() => navigate('/admin/proposals')} className="hover:text-primary-500 transition-colors">{t('proposals.title')}</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-900 font-medium">{proposal.proposal}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            {t('proposals.proposal')} {proposal.proposal}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
            <span>{proposal.clientName}</span>
            {proposal.seller && <span>{t('proposals.seller')}: {proposal.seller}</span>}
            {proposal.company && <span>{t('proposals.company')}: {proposal.company}</span>}
            {proposal.clientEmail && (
              <a href={`mailto:${proposal.clientEmail}`} className="inline-flex items-center gap-1 hover:text-primary-500 transition-colors">
                <Mail className="h-3.5 w-3.5" />{proposal.clientEmail}
              </a>
            )}
            {proposal.cellPhone && (
              <a href={`tel:${proposal.cellPhone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-1 hover:text-primary-500 transition-colors">
                <Phone className="h-3.5 w-3.5" />{proposal.cellPhone}
              </a>
            )}
          </div>
        </div>
        <StatusBadge status={proposal.captureStatus} />
      </div>

      {/* Info cards with icons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50"><Gamepad2 className="h-5 w-5 text-primary-500" /></div>
          <div><p className="text-xs text-neutral-500">{t('proposals.game')}</p><p className="font-semibold text-sm">{proposal.game}</p></div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50"><Hotel className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xs text-neutral-500">{t('proposals.hotel')}</p><p className="font-semibold text-sm">{proposal.hotel || <span className="text-neutral-400 italic">{t('proposals.noHotel')}</span>}</p></div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-50"><Users className="h-5 w-5 text-violet-500" /></div>
          <div><p className="text-xs text-neutral-500">{t('proposals.pax')}</p><p className="font-semibold text-sm">{proposal.totalPax}</p></div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-50"><Users className="h-5 w-5 text-accent-500" /></div>
          <div><p className="text-xs text-neutral-500">{t('proposals.forms')}</p><p className="font-semibold text-sm">{proposal.filledSlots} / {proposal.totalPax > 0 && proposal.totalSlots === 0 ? proposal.totalPax : proposal.totalSlots}</p></div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-100"><Calendar className="h-5 w-5 text-neutral-500" /></div>
          <div><p className="text-xs text-neutral-500">{t('client.proposal.deadline')}</p><p className="font-semibold text-sm">{proposal.deadline ? new Date(proposal.deadline).toLocaleDateString() : '—'}</p></div>
        </Card>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-700">{t('proposals.progress')}</h3>
          <span className="text-sm font-mono text-neutral-500">{proposal.progressPercent}%</span>
        </div>
        <ProgressBar value={proposal.progressPercent} size="md" />
      </Card>

      {/* Dispatch Prerequisites */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">{t('proposals.prerequisites')}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm">
            {isConfirmed ? <CheckCircle2 className="h-4 w-4 text-accent-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span className={isConfirmed ? 'text-accent-700' : 'text-red-600'}>{t('proposals.statusConfirmed')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {hasEmail ? <CheckCircle2 className="h-4 w-4 text-accent-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span className={hasEmail ? 'text-accent-700' : 'text-red-600'}>{t('proposals.emailAvailable')}</span>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Button
            variant="primary"
            onClick={() => dispatchEmail.mutate()}
            loading={dispatchEmail.isPending}
            disabled={!canDispatch}
            title={!isConfirmed ? t('proposals.notConfirmed') : !hasEmail ? t('proposals.noEmail') : undefined}
          >
            <Send className="h-4 w-4 mr-2" /> {t('proposals.sendEmail')}
          </Button>
          {!canDispatch && (
            <span className="absolute -bottom-5 left-0 text-[10px] text-red-500">
              {!isConfirmed ? t('proposals.notConfirmed') : t('proposals.noEmail')}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => dispatchLink.mutate()}
          loading={dispatchLink.isPending}
          disabled={!canDispatch}
          title={!isConfirmed ? t('proposals.notConfirmed') : !hasEmail ? t('proposals.noEmail') : undefined}
        >
          <Link2 className="h-4 w-4 mr-2" /> {t('proposals.generateLink')}
        </Button>
        <Button variant="outline" onClick={() => navigate(`/admin/proposals/${id}/matrix`)}>
          <Grid3X3 className="h-4 w-4 mr-2" /> {t('proposals.dataMatrix')}
        </Button>
        <div className="relative" ref={exportRef}>
          <Button variant="outline" onClick={() => setExportOpen(!exportOpen)}>
            <Download className="h-4 w-4 mr-2" /> {t('proposals.exportCsv')}
          </Button>
          {exportOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg border border-neutral-200 z-20 min-w-[200px] py-1">
              <button onClick={() => handleExport('full_matrix')} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors">
                {t('proposals.exportMatrix')}
              </button>
              <button onClick={() => handleExport('form_responses')} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors">
                {t('proposals.exportResponses')}
              </button>
              <button onClick={() => handleExport('sales_log')} className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors">
                {t('proposals.exportSalesLog')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dispatch result — credentials for manual sharing */}
      {dispatchInfo && (
        <Card className="mb-6 border-primary-200 bg-primary-50/50">
          <h3 className="text-sm font-semibold text-primary-700 mb-3">
            {dispatchInfo.emailSent ? t('proposals.emailSentSuccess') : t('proposals.linkCredentials')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 w-16 shrink-0">Link:</span>
              <span className="text-sm font-mono text-primary-700 flex-1 truncate">{dispatchInfo.clientLink}</span>
              <button onClick={() => copyToClipboard(dispatchInfo.clientLink, 'link')} className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700">
                {copied === 'link' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === 'link' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 w-16 shrink-0">E-mail:</span>
              <span className="text-sm font-mono text-neutral-700 flex-1">{dispatchInfo.clientEmail}</span>
              <button onClick={() => copyToClipboard(dispatchInfo.clientEmail, 'email')} className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700">
                {copied === 'email' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === 'email' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            {dispatchInfo.tempPassword && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 w-16 shrink-0">{t('proposals.tempPassword')}:</span>
                <code className="text-sm bg-white/60 px-2 py-0.5 rounded border border-primary-100 text-neutral-800">{dispatchInfo.tempPassword}</code>
                <button onClick={() => copyToClipboard(dispatchInfo.tempPassword!, 'password')} className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700">
                  {copied === 'password' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === 'password' ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Passenger Overview */}
      {Object.keys(roomCounts).length > 0 && (
        <>
          <h3 className="text-lg font-display font-semibold text-neutral-900 mb-3">{t('proposals.passengerOverview')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(roomCounts).map(([room, count]) => (
              <Card key={room} padding="sm" className="text-center">
                <p className="text-xs text-neutral-500 mb-1">{room}</p>
                <p className="text-lg font-bold text-neutral-900">{count}</p>
                <p className="text-[10px] text-neutral-400">{t('proposals.paxPerRoom')}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
