/** Linked personal apps — keep URLs in one place. */
export const TRACKER_URL = 'https://dist-psi-virid-48.vercel.app';
export const TRACKER_ORIGIN = new URL(TRACKER_URL).origin;

export function trackerEmbedUrl() {
  const url = new URL(TRACKER_URL);
  url.searchParams.set('embed', '1');
  url.searchParams.set('from', 'orbit');
  return url.toString();
}
