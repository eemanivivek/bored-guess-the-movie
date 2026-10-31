export const WATCH_PLATFORMS = {
 youtube: { name: 'YouTube', hosts: ['www.youtube.com'], path: /^\/watch$/, icon: 'youtube' },
 netflix: { name: 'Netflix', hosts: ['www.netflix.com'], path: /^\/(?:in\/)?title\/\d+\/?$/, icon: 'netflix' },
 prime: { name: 'Prime Video', hosts: ['www.primevideo.com'], path: /^\/detail\/[A-Za-z0-9-]+(?:\/[A-Z0-9]+)?\/?$/, icon: 'prime' },
 hotstar: { name: 'JioHotstar', hosts: ['www.jiohotstar.com', 'www.hotstar.com'], path: /^\/(?:in\/)?movies\/.+/, icon: 'hotstar' },
 zee5: { name: 'ZEE5', hosts: ['www.zee5.com'], path: /^\/movies\/details\/.+/, icon: 'zee5' },
 aha: { name: 'aha', hosts: ['www.aha.video'], path: /^\/movie\/[a-z0-9-]+\/?$/, icon: 'aha' },
 sunnxt: { name: 'Sun NXT', hosts: ['www.sunnxt.com'], path: /^\/telugu-movie-[a-z0-9-]+\/detail\/\d+\/?$/, icon: 'sunnxt' }
} as const;

export type WatchPlatform = keyof typeof WATCH_PLATFORMS;

export interface WatchLink {
 movieId: number;
 platform: WatchPlatform;
 language: string;
 url: string;
 sourceUrl: string;
 checkedAt: string;
 note?: string;
}

/** Only reviewed Telugu listings on the matching platform's movie page are displayed. */
export function isTeluguWatchLink(link: WatchLink): boolean {
 if (link.language !== 'Telugu' || !link.checkedAt || !link.sourceUrl) return false;
 const platform = WATCH_PLATFORMS[link.platform];
 if (!platform) return false;
 try {
  const url = new URL(link.url);
  return url.protocol === 'https:' && !url.username && !url.password && !url.port
   && platform.hosts.some(host => host === url.hostname) && platform.path.test(url.pathname)
   && (link.platform !== 'youtube' || /^[\w-]{11}$/.test(url.searchParams.get('v') ?? ''));
 } catch { return false; }
}
