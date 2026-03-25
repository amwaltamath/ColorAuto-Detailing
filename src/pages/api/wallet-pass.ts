import type { APIRoute } from 'astro';
import { PKPass } from 'passkit-generator';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Apple Wallet .pkpass endpoint.
 *
 * Required env vars (set in .env / Vercel dashboard):
 *   APPLE_PASS_TYPE_ID  — e.g. "pass.com.colorautodetailing.businesscard"
 *   APPLE_TEAM_ID       — your 10-char Apple Team ID
 *   APPLE_PASS_CERT     — PEM content of the signer certificate  (or file path)
 *   APPLE_PASS_KEY      — PEM content of the signer private key  (or file path)
 *   APPLE_PASS_KEY_PASSPHRASE — passphrase for the key (if encrypted)
 *   APPLE_WWDR_CERT     — PEM content of the WWDR G4 certificate (or file path)
 */

function readPem(envValue: string): string | Buffer {
  if (envValue.includes('-----BEGIN')) return envValue;
  const resolved = path.isAbsolute(envValue)
    ? envValue
    : path.resolve(process.cwd(), envValue);
  return fs.readFileSync(resolved);
}

function getEnv(key: string): string | undefined {
  return (import.meta.env[key] ?? process.env[key]) as string | undefined;
}

/** Load pass model images from disk into buffers for the PKPass constructor. */
function loadModelBuffers(): Record<string, Buffer> {
  const modelDir = path.resolve(process.cwd(), 'wallet-pass-model.pass');
  const files: Record<string, Buffer> = {};
  for (const name of fs.readdirSync(modelDir)) {
    if (name === 'pass.json') continue; // we provide pass props via constructor
    const filePath = path.join(modelDir, name);
    if (fs.statSync(filePath).isFile()) {
      files[name] = fs.readFileSync(filePath);
    }
  }
  return files;
}

const passJson = {
  formatVersion: 1 as const,
  organizationName: 'ColorAuto Detailing',
  description: 'ColorAuto Detailing Business Card',
  foregroundColor: 'rgb(255, 255, 255)',
  backgroundColor: 'rgb(37, 99, 235)',
  labelColor: 'rgb(191, 219, 254)',
  logoText: 'ColorAuto Detailing',
  sharingProhibited: false,
  generic: {
    primaryFields: [
      { key: 'company', label: 'COMPANY', value: 'ColorAuto Detailing' },
    ],
    secondaryFields: [
      { key: 'phone', label: 'PHONE', value: '970-628-1505' },
      { key: 'email', label: 'EMAIL', value: 'admin@colorautodetailing.com' },
    ],
    auxiliaryFields: [
      { key: 'address', label: 'ADDRESS', value: '562 S Westgate Drive, Grand Junction, CO 81505' },
    ],
    backFields: [
      { key: 'services', label: 'SERVICES', value: 'Auto Detailing • Paint Correction • Paint Protection Film • Ceramic Coating • Window Tinting • Color PPF' },
      { key: 'hours', label: 'BUSINESS HOURS', value: 'Monday – Friday: 8:00 AM – 5:00 PM\nSaturday – Sunday: Closed' },
      { key: 'website', label: 'WEBSITE', value: 'https://colorautodetailing.com' },
      { key: 'directions', label: 'DIRECTIONS', value: 'https://maps.app.goo.gl/U8GewAAibaMwEZ8q8' },
    ],
  },
  barcode: {
    format: 'PKBarcodeFormatQR',
    message: 'https://colorautodetailing.com/business-card',
    messageEncoding: 'iso-8859-1',
  },
  barcodes: [
    {
      format: 'PKBarcodeFormatQR',
      message: 'https://colorautodetailing.com/business-card',
      messageEncoding: 'iso-8859-1',
    },
  ],
  locations: [
    { latitude: 39.0639, longitude: -108.5842, relevantText: "You're near ColorAuto Detailing!" },
  ],
};

export const GET: APIRoute = async ({ redirect }) => {
  const passTypeId = getEnv('APPLE_PASS_TYPE_ID');
  const teamId = getEnv('APPLE_TEAM_ID');
  const certEnv = getEnv('APPLE_PASS_CERT');
  const keyEnv = getEnv('APPLE_PASS_KEY');
  const wwdrEnv = getEnv('APPLE_WWDR_CERT');

  if (!passTypeId || !teamId || !certEnv || !keyEnv || !wwdrEnv) {
    return redirect('/api/vcard', 302);
  }

  try {
    const buffers = loadModelBuffers();

    const pass = new PKPass(
      buffers,
      {
        wwdr: readPem(wwdrEnv),
        signerCert: readPem(certEnv),
        signerKey: readPem(keyEnv),
        signerKeyPassphrase: getEnv('APPLE_PASS_KEY_PASSPHRASE'),
      },
      {
        ...passJson,
        passTypeIdentifier: passTypeId,
        teamIdentifier: teamId,
        serialNumber: `colorauto-bcard-${Date.now()}`,
      },
    );

    const buffer = pass.getAsBuffer();

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="ColorAuto-Detailing.pkpass"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Failed to generate Apple Wallet pass:', err);
    // Fall back to vCard if pass generation fails
    return redirect('/api/vcard', 302);
  }
};
