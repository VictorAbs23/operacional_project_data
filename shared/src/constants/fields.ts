export enum FieldType {
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  DATE = 'DATE',
  SELECT = 'SELECT',
  PHONE = 'PHONE',
  DOCUMENT = 'DOCUMENT',
  PHOTO = 'PHOTO',
}

export enum FieldFillableBy {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
  BOTH = 'BOTH',
}

export interface FieldDefinition {
  key: string;
  labelPt: string;
  labelEn: string;
  type: FieldType;
  required: boolean;
  fillableBy: FieldFillableBy;
  order: number;
  options?: string[];
  placeholderPt?: string;
  placeholderEn?: string;
}

export const PASSENGER_FIELDS: FieldDefinition[] = [
  // Client fields (order 1-12)
  {
    key: 'full_name',
    labelPt: 'Nome completo',
    labelEn: 'Full name',
    type: FieldType.TEXT,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 1,
    placeholderPt: 'Primeiro nome e sobrenome',
    placeholderEn: 'First and last name',
  },
  {
    key: 'nationality',
    labelPt: 'Nacionalidade',
    labelEn: 'Nationality',
    type: FieldType.TEXT,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 2,
    placeholderPt: 'Ex: Brasileira',
    placeholderEn: 'Ex: Brazilian',
  },
  {
    key: 'gender',
    labelPt: 'Genero',
    labelEn: 'Gender',
    type: FieldType.SELECT,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 3,
    options: ['Masculino|Male', 'Feminino|Female', 'Outro|Other'],
  },
  {
    key: 'document_type',
    labelPt: 'Tipo de documento',
    labelEn: 'Document type',
    type: FieldType.SELECT,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 4,
    options: ['CPF', 'RG', 'Passaporte|Passport', 'DNI'],
  },
  {
    key: 'document_number',
    labelPt: 'Numero do documento',
    labelEn: 'Document number',
    type: FieldType.DOCUMENT,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 5,
  },
  {
    key: 'document_issuing_country',
    labelPt: 'Pais emissor do documento',
    labelEn: 'Document issuing country',
    type: FieldType.TEXT,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 6,
  },
  {
    key: 'document_expiry_date',
    labelPt: 'Data de validade do documento',
    labelEn: 'Document expiry date',
    type: FieldType.DATE,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 7,
  },
  {
    key: 'birth_date',
    labelPt: 'Data de nascimento',
    labelEn: 'Date of birth',
    type: FieldType.DATE,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 8,
  },
  {
    key: 'fan_team',
    labelPt: 'Time que torce',
    labelEn: 'Fan team',
    type: FieldType.TEXT,
    required: false,
    fillableBy: FieldFillableBy.CLIENT,
    order: 9,
    placeholderPt: 'Opcional',
    placeholderEn: 'Optional',
  },
  {
    key: 'phone',
    labelPt: 'Telefone',
    labelEn: 'Phone',
    type: FieldType.PHONE,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 10,
    placeholderPt: '+55 11 99999-9999',
    placeholderEn: '+1 555 123-4567',
  },
  {
    key: 'email',
    labelPt: 'E-mail',
    labelEn: 'Email',
    type: FieldType.EMAIL,
    required: true,
    fillableBy: FieldFillableBy.CLIENT,
    order: 11,
  },
  {
    key: 'profile_photo',
    labelPt: 'Foto de perfil',
    labelEn: 'Profile photo',
    type: FieldType.PHOTO,
    required: false,
    fillableBy: FieldFillableBy.CLIENT,
    order: 12,
  },
  // Admin-only fields (order 13-17)
  {
    key: 'ticket_status',
    labelPt: 'Status do ingresso',
    labelEn: 'Ticket status',
    type: FieldType.TEXT,
    required: false,
    fillableBy: FieldFillableBy.ADMIN,
    order: 13,
  },
  {
    key: 'hotel_confirmation_number',
    labelPt: 'Numero de confirmacao do hotel',
    labelEn: 'Hotel confirmation number',
    type: FieldType.TEXT,
    required: false,
    fillableBy: FieldFillableBy.ADMIN,
    order: 14,
  },
  {
    key: 'flight_locator',
    labelPt: 'Localizador do voo',
    labelEn: 'Flight locator',
    type: FieldType.TEXT,
    required: false,
    fillableBy: FieldFillableBy.ADMIN,
    order: 15,
  },
  {
    key: 'insurance_number',
    labelPt: 'Numero do seguro',
    labelEn: 'Insurance number',
    type: FieldType.TEXT,
    required: false,
    fillableBy: FieldFillableBy.ADMIN,
    order: 16,
  },
  {
    key: 'transfer_reference',
    labelPt: 'Referencia do transfer',
    labelEn: 'Transfer reference',
    type: FieldType.TEXT,
    required: false,
    fillableBy: FieldFillableBy.ADMIN,
    order: 17,
  },
];
