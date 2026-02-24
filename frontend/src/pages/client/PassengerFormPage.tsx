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
import { ArrowLeft, Save, User, IdCard, Phone, Heart } from 'lucide-react';
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

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary-50">
        {icon}
      </div>
      <h2 className="text-lg font-display font-semibold text-neutral-900">{title}</h2>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate(`/client/proposal/${accessId}`)}
        className="group flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        {t('client.proposal.title')}
      </button>

      {/* Page header */}
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

      <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
        {/* Section 1: Personal Information */}
        <Card padding="lg">
          {sectionHeader(
            <User className="h-5 w-5 text-primary-500" />,
            t('client.section.personal')
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('passenger.fullName')} required error={errors.full_name?.message} {...register('full_name')} />
            <Input label={t('passenger.nationality')} required error={errors.nationality?.message} {...register('nationality')} />
            <Select label={t('passenger.gender')} options={genderOptions} placeholder="--" error={errors.gender?.message} {...register('gender')} />
            <Input label={t('passenger.birthDate')} type="date" required error={errors.birth_date?.message} {...register('birth_date')} />
          </div>
        </Card>

        {/* Section 2: Documentation */}
        <Card padding="lg">
          {sectionHeader(
            <IdCard className="h-5 w-5 text-primary-500" />,
            t('client.section.documents')
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label={t('passenger.documentType')} options={docTypeOptions} placeholder="--" error={errors.document_type?.message} {...register('document_type')} />
            <Input label={t('passenger.documentNumber')} required error={errors.document_number?.message} {...register('document_number')} />
            <Input label={t('passenger.issuingCountry')} required error={errors.document_issuing_country?.message} {...register('document_issuing_country')} />
            <Input label={t('passenger.expiryDate')} type="date" required error={errors.document_expiry_date?.message} {...register('document_expiry_date')} />
          </div>
        </Card>

        {/* Section 3: Contact */}
        <Card padding="lg">
          {sectionHeader(
            <Phone className="h-5 w-5 text-primary-500" />,
            t('client.section.contact')
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('passenger.phone')} type="tel" required error={errors.phone?.message} {...register('phone')} />
            <Input label={t('passenger.email')} type="email" required error={errors.email?.message} {...register('email')} />
          </div>
        </Card>

        {/* Section 4: Preferences & Photo */}
        <Card padding="lg">
          {sectionHeader(
            <Heart className="h-5 w-5 text-primary-500" />,
            t('client.section.preferences')
          )}
          <div className="space-y-4">
            <Input label={t('passenger.fanTeam')} error={errors.fan_team?.message} {...register('fan_team')} />
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
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" size="lg" loading={isSubmitting || saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" /> {t('passenger.save')}
          </Button>
          <button
            type="button"
            onClick={() => navigate(`/client/proposal/${accessId}`)}
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
