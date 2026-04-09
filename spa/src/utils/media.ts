export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!configuredApiUrl) {
    return url;
  }

  const normalizedBase = configuredApiUrl.replace(/\/+$/, '');
  const originOnly = normalizedBase.replace(/\/api(?:\/v\d+)?$/i, '');
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;

  return `${originOnly}${normalizedPath}`;
};
