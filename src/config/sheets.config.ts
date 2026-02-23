import { google } from 'googleapis';
import { env } from './env.js';
import { logger } from './logger.js';
import path from 'path';
import fs from 'fs';

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

export async function getAuthSheets() {
  if (sheetsClient) return sheetsClient;

  try {
    let auth;

    if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      // Production: parse credentials from env var
      const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      logger.info('Google Sheets auth: using env var credentials');
    } else {
      // Development: use local credentials.json file (in project root)
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const credentialsPath = path.resolve(__dirname, '../../../credentials.json');
      if (!fs.existsSync(credentialsPath)) {
        logger.warn('No Google credentials found. Sheets sync will not work.');
        return null;
      }
      auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      logger.info('Google Sheets auth: using local credentials.json');
    }

    sheetsClient = google.sheets({ version: 'v4', auth });
    return sheetsClient;
  } catch (err) {
    sheetsClient = null;
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Google Sheets auth failed: ${message}. Sheets sync will not work.`);
    return null;
  }
}
