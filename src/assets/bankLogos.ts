/// <reference types="vite/client" />

const rawLogos = import.meta.glob('./logos/*.svg', { eager: true, query: '?raw', import: 'default' });

export const BANK_LOGOS: Record<string, string> = {};

for (const path in rawLogos) {
  const fileName = path.split('/').pop()?.replace('.svg', '');
  if (fileName) {
    const rawSvg = rawLogos[path] as string;
    BANK_LOGOS[fileName] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg)}`;
  }
}

export const DEFAULT_BANK_LOGO = BANK_LOGOS['bank-icon'] || '';

// Map bank IDs or legacy names to actual SVG filenames if they differ
const BANK_ID_TO_LOGO_KEY: Record<string, string> = {
  raif: 'raiff',
  rencredit: 'renaissance',
  bspb: 'bsaintpet',
};

/**
 * Resolves standard bank logos, custom uploaded base64 data URLs,
 * and legacy "/logos/*.svg" paths stored in user history.
 */
export function resolveLogoUrl(url?: string, bankId?: string): string | undefined {
  if (!url) {
    if (bankId) {
      const key = BANK_ID_TO_LOGO_KEY[bankId] || bankId;
      if (BANK_LOGOS[key]) return BANK_LOGOS[key];
    }
    return undefined;
  }

  // Handle legacy "/logos/*.svg" paths stored in database / localStorage
  if (url.startsWith('/logos/')) {
    const rawName = url.replace('/logos/', '').replace('.svg', '');
    if (rawName === 'bank-icon') return DEFAULT_BANK_LOGO;
    const key = BANK_ID_TO_LOGO_KEY[rawName] || rawName;
    if (BANK_LOGOS[key]) return BANK_LOGOS[key];
    if (bankId) {
      const bKey = BANK_ID_TO_LOGO_KEY[bankId] || bankId;
      if (BANK_LOGOS[bKey]) return BANK_LOGOS[bKey];
    }
    return DEFAULT_BANK_LOGO;
  }

  return url;
}
