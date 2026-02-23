import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passengerFormSchema, type PassengerFormInput } from '@absolutsport/shared';
import { useLanguageStore } from '../../stores/languageStore';
import { formsApi } from '../../services/forms.api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { DropZone } from '../../components/ui/DropZone';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft, Save, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function PassengerFormPage() {
  const { accessId, slotId } = useParams<{ accessId: string; slotId: string }>();
  const navigate = useNavigate();
  const t = useLanguageStore((s) => s.t);
  const queryClient = useQueryClient();

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: slot, isLoading } = useQuery({
    queryKey: ['passenger-slot', slotId],
    queryFn: () => formsApi.getPassengerSlot(slotId!),
    enabled: !!slotId,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PassengerFormInput>({
    resolver: zodResolver(passengerFormSchema),
    values: slot?.response?.answers || {},
  });

  const saveMutation = useMutation({
    mutationFn: (answers: PassengerFormInput) => formsApi.savePassenger(slotId!, answers),
    onSuccess: () => {
      toast('success', t('passenger.saved'));
      queryClient.invalidateQueries({ queryKey: ['form-instance', accessId] });
      queryClient.invalidateQueries({ queryKey: ['passenger-slot', slotId] });
    },
    onError: () => toast('error', t('common.error')),
  });

  if (isLoading) return <Spinner className="mt-20" />;

  const genderOptions = [
    { value: 'Masculino|Male', label: t('passenger.gender') === 'Gender' ? 'Male' : 'Masculino' },
    { value: 'Feminino|Female', label: t('passenger.gender') === 'Gender' ? 'Female' : 'Feminino' },
    { value: 'Outro|Other', label: t('passenger.gender') === 'Gender' ? 'Other' : 'Outro' },
  ];

  const docTypeOptions = [
    { value: 'CPF', label: 'CPF' },
    { value: 'RG', label: 'RG' },
    { value: 'Passaporte|Passport', label: t('passenger.documentType') === 'Document type' ? 'Passport' : 'Passaporte' },
    { value: 'DNI', label: 'DNI' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button onClick={() => navigate(`/client/proposal/${accessId}`)} className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> {t('client.proposal.title')}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary-50">
          <User className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            {t('client.proposal.passenger')} {(slot?.slotIndex ?? 0) + 1}
          </h1>
          <p className="text-neutral-500">{slot?.roomLabel}</p>
        </div>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('passenger.fullName')} required error={errors.full_name?.message} {...register('full_name')} />
            <Input label={t('passenger.nationality')} required error={errors.nationality?.message} {...register('nationality')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label={t('passenger.gender')} options={genderOptions} placeholder="--" error={errors.gender?.message} {...register('gender')} />
            <Select label={t('passenger.documentType')} options={docTypeOptions} placeholder="--" error={errors.document_type?.message} {...register('document_type')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('passenger.documentNumber')} required error={errors.document_number?.message} {...register('document_number')} />
            <Input label={t('passenger.issuingCountry')} required error={errors.document_issuing_country?.message} {...register('document_issuing_country')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('passenger.expiryDate')} type="date" required error={errors.document_expiry_date?.message} {...register('document_expiry_date')} />
            <Input label={t('passenger.birthDate')} type="date" required error={errors.birth_date?.message} {...register('birth_date')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('passenger.phone')} type="tel" required error={errors.phone?.message} {...register('phone')} />
            <Input label={t('passenger.email')} type="email" required error={errors.email?.message} {...register('email')} />
          </div>

          <Input label={t('passenger.fanTeam')} error={errors.fan_team?.message} {...register('fan_team')} />

          {/* Document photo upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              {t('passenger.photo')}
            </label>
            <DropZone
              onFile={(file) => {
                const url = URL.createObjectURL(file);
                setPhotoPreview(url);
              }}
              preview={photoPreview || slot?.response?.answers?.profile_photo || null}
              onClear={() => setPhotoPreview(null)}
              accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }}
            />
            <input type="hidden" {...register('profile_photo')} value={photoPreview || ''} />
          </div>

          <div className="pt-4 border-t border-neutral-200">
            <Button type="submit" loading={isSubmitting || saveMutation.isPending} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" /> {t('passenger.save')}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
