import { z } from 'zod';

export const passengerFormSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  nationality: z.string().min(2, 'Nationality is required'),
  gender: z.enum(['Masculino|Male', 'Feminino|Female', 'Outro|Other']),
  document_type: z.enum(['CPF', 'RG', 'Passaporte|Passport', 'DNI']),
  document_number: z.string().min(3, 'Document number is required'),
  document_issuing_country: z.string().min(2, 'Issuing country is required'),
  document_expiry_date: z.string().min(1, 'Expiry date is required'),
  birth_date: z.string().min(1, 'Date of birth is required'),
  fan_team: z.string().optional().default(''),
  phone: z.string().min(8, 'Phone is required'),
  email: z.string().email('Invalid email'),
  profile_photo: z.string().optional().default(''),
});

export const adminFieldsSchema = z.object({
  ticket_status: z.string().optional().default(''),
  hotel_confirmation_number: z.string().optional().default(''),
  flight_locator: z.string().optional().default(''),
  insurance_number: z.string().optional().default(''),
  transfer_reference: z.string().optional().default(''),
});

export const fullPassengerSchema = passengerFormSchema.merge(adminFieldsSchema);

export type PassengerFormInput = z.infer<typeof passengerFormSchema>;
export type AdminFieldsInput = z.infer<typeof adminFieldsSchema>;
export type FullPassengerInput = z.infer<typeof fullPassengerSchema>;
