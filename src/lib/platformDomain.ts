/**
 * Canonical production host for tenant URLs. Override only when a verified
 * custom wildcard domain is configured for the deployment.
 */
export const PLATFORM_DOMAIN = (
  import.meta.env.VITE_PLATFORM_DOMAIN || 'new-tamplete-app.vercel.app'
).toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

export function platformUrl(path = ''): string {
  return `https://${PLATFORM_DOMAIN}${path.startsWith('/') || !path ? path : `/${path}`}`;
}
