import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PASSENGER_FIELDS } from '@absolutsport/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed master users
  const passwordHash = await bcrypt.hash('Dron3120@', 12);

  const masterUsers = [
    {
      email: 'victorcesar2031@gmail.com',
      name: 'Victor Cesar',
      passwordHash,
      role: 'MASTER',
      isActive: true,
      mustChangePassword: false,
    },
    {
      email: 'bianca.bianchi@absolut-sport.com.br',
      name: 'Bianca Bianchi',
      passwordHash,
      role: 'MASTER',
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const user of masterUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`  User: ${user.email} (${user.role})`);
  }

  // Seed form field definitions
  for (const field of PASSENGER_FIELDS) {
    await prisma.formFieldDefinition.upsert({
      where: { key: field.key },
      update: {
        labelPt: field.labelPt,
        labelEn: field.labelEn,
        type: field.type,
        required: field.required,
        fillableBy: field.fillableBy,
        order: field.order,
        options: field.options ? field.options : Prisma.JsonNull,
        placeholderPt: field.placeholderPt ?? null,
        placeholderEn: field.placeholderEn ?? null,
      },
      create: {
        key: field.key,
        labelPt: field.labelPt,
        labelEn: field.labelEn,
        type: field.type,
        required: field.required,
        fillableBy: field.fillableBy,
        order: field.order,
        options: field.options ? field.options : Prisma.JsonNull,
        placeholderPt: field.placeholderPt ?? null,
        placeholderEn: field.placeholderEn ?? null,
      },
    });
  }
  console.log(`  ${PASSENGER_FIELDS.length} form field definitions seeded`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
