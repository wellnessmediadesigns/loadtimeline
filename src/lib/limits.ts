/** Free vs Pro limits. Pro unlock is a local flag in V1 (see store/settings). */

export const FREE_LOAD_LIMIT = 25;
export const PRO_PRICE = '$6.99';

export const APP_INFO = {
  name: 'LoadTimeline',
  tagline: 'Documentation Made Simple',
  subtitle: 'Professional Load Documentation',
  brand: 'Organized Freight',
  website: 'OrganizedFreight.com',
  version: '1.0.0',
} as const;

/** Whether a new load may be created given Pro status + current count. */
export function canCreateLoad(isPro: boolean, currentCount: number): boolean {
  return isPro || currentCount < FREE_LOAD_LIMIT;
}
