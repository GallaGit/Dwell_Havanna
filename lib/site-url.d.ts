export const DEFAULT_SITE_URL: string;

export function resolveSiteUrl(
  value: string | null | undefined,
  warn?: (message: string) => void,
): string;

export const siteUrl: string;
