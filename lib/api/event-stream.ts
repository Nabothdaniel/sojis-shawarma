function sanitizeBaseUrl(url: string) {
  return url.replace(/["';]/g, '');
}

export function getEventStreamBaseUrl() {


  const envUrl = sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

  if (!envUrl) {
    return '/api';
  }

  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
}

export function getEventStreamUrl(token?: string | null) {
  const baseUrl = getEventStreamBaseUrl();
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(`${baseUrl}/events/stream`, origin);

  if (token) {
    url.searchParams.set('token', token);
  }

  return url.toString();
}
