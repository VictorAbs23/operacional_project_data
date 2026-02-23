import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SHEETS_SPREADSHEET_ID: z.string().optional().default(''),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional().default(''),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_KEY: z.string().optional().default(''),
  SUPABASE_BUCKET: z.string().optional().default('profile-photos'),
  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM: z.string().optional().default('RISYS <noreply@mail.agentelab.com.br>'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
