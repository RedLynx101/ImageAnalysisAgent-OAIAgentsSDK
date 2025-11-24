import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  PERPLEXITY_API_KEY: z.string().min(1),
  GMAIL_CLIENT_ID: z.string().min(1),
  GMAIL_CLIENT_SECRET: z.string().min(1),
  GMAIL_REFRESH_TOKEN: z.string().min(1),
  GMAIL_SENDER_EMAIL: z.string().email(),
  TRIGGER_SECRET_KEY: z.string().optional(), // Optional for build time
  TRIGGER_API_URL: z.string().url().default('https://api.trigger.dev'),
});

export const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn('❌ Invalid environment variables:', parsed.error.format());
    // Don't throw here to allow build to pass in CI/CD without env vars
    return process.env as any;
  }
  return parsed.data;
};

export const env = process.env;

