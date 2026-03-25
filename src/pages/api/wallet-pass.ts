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
  // Treat as file path
  const resolved = path.isAbsolute(envValue)
    ? envValue
    : path.resolve(process.cwd(), envValue);
  return fs.readFileSync(resolved);
}

function getEnv(key: string): string | undefined {
  // Astro exposes .env vars via import.meta.env; process.env works on Vercel
  return (import.meta.env[key] ?? process.env[key]) as string | undefined;
}

export const GET: APIRoute = async ({ redirect }) => {
  const passTypeId = getEnv('APPLE_PASS_TYPE_ID');
  const teamId = getEnv('APPLE_TEAM_ID');
  const certEnv = getEnv('APPLE_PASS_CERT');
  const keyEnv = getEnv('APPLE_PASS_KEY');
  const wwdrEnv = getEnv('APPLE_WWDR_CERT');

  // Fall back to vCard download if certs are not configured
  if (!passTypeId || !teamId || !certEnv || !keyEnv || !wwdrEnv) {
    return redirect('/api/vcard', 302);
  }

  try {
    const modelDir = path.resolve(process.cwd(), 'wallet-pass-model.pass');

    const pass = await PKPass.from(
      { model: modelDir, certificates: {
        wwdr: readPem(wwdrEnv),
        signerCert: readPem(certEnv),
        signerKey: readPem(keyEnv),
        signerKeyPassphrase: getEnv('APPLE_PASS_KEY_PASSPHRASE'),
      }},
      {
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
