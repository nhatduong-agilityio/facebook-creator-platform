import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

let envLoaded = false;

export function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/api/.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env')
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    dotenv.config({
      path: candidate,
      override: true
    });
    envLoaded = true;
    return;
  }

  dotenv.config({
    override: true
  });
  envLoaded = true;
}

loadEnv();
