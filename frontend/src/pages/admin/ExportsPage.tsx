import { useState } from 'react';
import { useLanguageStore } from '../../stores/languageStore';
import { exportsApi } from '../../services/exports.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { Download, FileSpreadsheet } from 'lucide-react';

export function ExportsPage() {
  const t = useLanguageStore((s) => s.t);
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const exportTypes = [
    { type: 'full_matrix', label: t('exports.fullMatrix'), description: 'Sales Log + passenger data + admin fields' },
    { type: 'form_responses', label: t('exports.formResponses'), description: 'Passenger data only' },
    { type: 'sales_log', label: t('exports.salesLog'), description: 'Imported sheet data only' },
    { type: 'capture_status', label: t('exports.captureStatus'), description: 'One row per proposal' },
    { type: 'pending_risk', label: t('exports.pendingRisk'), description: 'Proposals < 100% with deadline risk' },
    { type: 'global_export', label: t('exports.globalExport'), description: 'All proposals, all passengers' },
  ];

  const handleExport = async (type: string) => {
    try {
      setLoadingType(type);
      await exportsApi.download(type);
      toast('success', t('common.success'));
    } catch {
      toast('error', t('common.error'));
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-6">{t('exports.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportTypes.map((exp) => (
          <Card key={exp.type} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary-500" />
              <div>
                <p className="font-semibold text-neutral-900">{exp.label}</p>
                <p className="text-sm text-neutral-500">{exp.description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={loadingType === exp.type}
              onClick={() => handleExport(exp.type)}
            >
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
