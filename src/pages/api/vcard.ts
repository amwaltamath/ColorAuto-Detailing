import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:;ColorAuto Detailing;;;',
    'FN:ColorAuto Detailing',
    'ORG:ColorAuto Detailing',
    'TITLE:Professional Auto Detailing',
    'TEL;TYPE=WORK,VOICE:+19706281505',
    'EMAIL;TYPE=WORK:admin@colorautodetailing.com',
    'ADR;TYPE=WORK:;;562 S Westgate Drive;Grand Junction;CO;81505;USA',
    'URL:https://colorautodetailing.com',
    'NOTE:Auto Detailing • Paint Correction • Paint Protection Film • Ceramic Coating • Window Tinting • Color PPF',
    'END:VCARD',
  ].join('\r\n');

  return new Response(vcard, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ColorAuto-Detailing.vcf"',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
