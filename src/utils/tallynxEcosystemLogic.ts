export function normalizeTraderHandle(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '');
}

export function buildCrossSubdomainSsoUrl(params: {
  baseDeskUrl?: string;
  handle?: string;
  lang?: 'en' | 'th';
  ssoToken?: string;
  fromPath?: string;
}): string {
  const fallback = 'https://mall.tallynx.com/';
  const rawBase = String(params.baseDeskUrl || fallback).trim() || fallback;
  try {
    const url = new URL(rawBase);
    url.searchParams.set('source', 'tallynx-portal');
    if (params.lang) {
      url.searchParams.set('lang', params.lang);
    }
    if (params.handle) {
      const normalized = normalizeTraderHandle(params.handle);
      if (normalized) {
        url.searchParams.set('profile', normalized);
      }
    }
    if (params.fromPath) {
      url.searchParams.set('from', params.fromPath);
    }
    if (params.ssoToken) {
      url.searchParams.set('sso_token', params.ssoToken);
    }
    return url.toString();
  } catch {
    return rawBase;
  }
}
