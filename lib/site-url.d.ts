export const DEFAULT_SITE_URL: string;
export const LOCAL_INVITE_ORIGIN: string;

export function resolveSiteUrl(
  value: string | null | undefined,
  warn?: (message: string) => void,
): string;

export function resolveInviteOrigin(
  value: string | null | undefined,
  warn?: (message: string) => void,
): string;

export const siteUrl: string;
