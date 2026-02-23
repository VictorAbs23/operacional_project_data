import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguageStore } from '../../stores/languageStore';
import { proposalsApi, type MatrixRow, type AdminFieldsUpdate } from '../../services/proposals.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft, Download, Check, X, Pencil } from 'lucide-react';

const ADMIN_FIELDS = [
  { key: 'ticketStatus', dbKey: 'ticket_status', i18n: 'matrix.ticketStatus' },
  { key: 'hotelConfirmation', dbKey: 'hotel_confirmation_number', i18n: 'matrix.hotelConfirmation' },
  { key: 'flightLocator', dbKey: 'flight_locator', i18n: 'matrix.flightLocator' },
  { key: 'insuranceNumber', dbKey: 'insurance_number', i18n: 'matrix.insuranceNumber' },
  { key: 'transferReference', dbKey: 'transfer_reference', i18n: 'matrix.transferReference' },
] as const;

const SALES_COLS = [
  { key: 'proposal', i18n: 'proposals.proposal' },
  { key: 'clientName', i18n: 'proposals.client' },
  { key: 'game', i18n: 'proposals.game' },
  { key: 'hotel', i18n: 'proposals.hotel' },
  { key: 'roomType', label: 'Room Type' },
  { key: 'checkIn', label: 'Check-in' },
  { key: 'checkOut', label: 'Check-out' },
  { key: 'ticketCategory', label: 'Ticket Cat.' },
  { key: 'seller', label: 'Seller' },
] as const;

const PASSENGER_COLS = [
  { key: 'roomLabel', i18n: 'matrix.room' },
  { key: 'slotIndex', i18n: 'matrix.pax' },
  { key: 'passengerName', i18n: 'passenger.fullName' },
  { key: 'nationality', i18n: 'passenger.nationality' },
  { key: 'gender', i18n: 'passenger.gender' },
  { key: 'documentType', i18n: 'passenger.documentType' },
  { key: 'documentNumber', i18n: 'passenger.documentNumber' },
  { key: 'issuingCountry', i18n: 'passenger.issuingCountry' },
  { key: 'expiryDate', i18n: 'passenger.expiryDate' },
  { key: 'birthDate', i18n: 'passenger.birthDate' },
  { key: 'phone', i18n: 'passenger.phone' },
  { key: 'email', i18n: 'passenger.email' },
] as const;

function EditableCell({ value, onSave, saving }: { value: string; onSave: (val: string) => void; saving: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };
  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full min-w-[100px] border border-primary-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button onClick={handleSave} className="p-0.5 text-accent-500 hover:text-accent-700" disabled={saving}>
          <Check className="h-3 w-3" />
        </button>
        <button onClick={handleCancel} className="p-0.5 text-neutral-400 hover:text-neutral-600">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div onClick={() => setEditing(true)} className="cursor-pointer group flex items-center gap-1 min-h-[24px]" title="Click to edit">
      <span className="text-xs">{value || '—'}</span>
      <Pencil className="h-3 w-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export function DataMatrixPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useLanguageStore((s) => s.t);
  const queryClient = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ['proposal-matrix', id],
    queryFn: () => proposalsApi.getMatrix(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ slotId, data }: { slotId: string; data: AdminFieldsUpdate }) =>
      proposalsApi.updateAdminFields(id!, slotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-matrix', id] });
      toast('success', t('matrix.saved'));
    },
    onError: () => toast('error', t('common.error')),
  });

  const handleAdminFieldSave = useCallback(
    (slotId: string, dbKey: string, value: string) => {
      updateMutation.mutate({ slotId, data: { [dbKey]: value } as AdminFieldsUpdate });
    },
    [updateMutation],
  );

  const exportCsv = useCallback(() => {
    if (!rows || rows.length === 0) return;
    const headers = [
      ...SALES_COLS.map((c) => ('label' in c ? c.label : t(c.i18n))),
      ...PASSENGER_COLS.map((c) => t(c.i18n)),
      ...ADMIN_FIELDS.map((c) => t(c.i18n)),
    ];
    const csvRows = rows.map((row) => [
      ...SALES_COLS.map((c) => String(row[c.key as keyof MatrixRow] ?? '')),
      ...PASSENGER_COLS.map((c) => {
        const v = row[c.key as keyof MatrixRow];
        if (c.key === 'slotIndex') return String((v as number) + 1);
        return String(v ?? '');
      }),
      ...ADMIN_FIELDS.map((c) => String(row[c.key as keyof MatrixRow] ?? '')),
    ]);
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...csvRows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matrix-${rows[0]?.proposal || id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, id, t]);

  if (isLoading) return <Spinner className="mt-20" />;

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate(`/admin/proposals/${id}`)} className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> {t('proposals.proposal')}
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-neutral-900">{t('matrix.title')}</h1>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows || rows.length === 0}>
          <Download className="h-4 w-4 mr-2" /> {t('matrix.exportCsv')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-xs font-medium">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-50 border border-blue-200" /> {t('matrix.salesLog')}</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-50 border border-green-200" /> {t('matrix.passengerData')}</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-50 border border-amber-200" /> {t('matrix.adminFields')}</span>
      </div>

      {(!rows || rows.length === 0) ? (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-md p-12 text-center text-neutral-500">
          {t('matrix.noData')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 shadow-md">
          <table className="text-xs whitespace-nowrap">
            <thead>
              <tr>
                {SALES_COLS.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 text-left font-semibold text-blue-800 bg-blue-50 border-b border-blue-200 sticky top-0">
                    {'label' in col ? col.label : t(col.i18n)}
                  </th>
                ))}
                {PASSENGER_COLS.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 text-left font-semibold text-green-800 bg-green-50 border-b border-green-200 sticky top-0">
                    {t(col.i18n)}
                  </th>
                ))}
                {ADMIN_FIELDS.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 text-left font-semibold text-amber-800 bg-amber-50 border-b border-amber-200 sticky top-0">
                    {t(col.i18n)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.slotId || i} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                  {SALES_COLS.map((col) => (
                    <td key={col.key} className="px-3 py-2 bg-blue-50/30 text-neutral-800">{String(row[col.key as keyof MatrixRow] ?? '')}</td>
                  ))}
                  {PASSENGER_COLS.map((col) => (
                    <td key={col.key} className="px-3 py-2 bg-green-50/30 text-neutral-800">
                      {col.key === 'slotIndex' ? String((row.slotIndex ?? 0) + 1) : String(row[col.key as keyof MatrixRow] ?? '')}
                    </td>
                  ))}
                  {ADMIN_FIELDS.map((col) => (
                    <td key={col.key} className="px-3 py-2 bg-amber-50/30">
                      <EditableCell
                        value={String(row[col.key as keyof MatrixRow] ?? '')}
                        onSave={(val) => handleAdminFieldSave(row.slotId, col.dbKey, val)}
                        saving={updateMutation.isPending}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
