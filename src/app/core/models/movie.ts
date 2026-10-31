export interface Movie { id: number; title: string; year: number; genres: string[]; moods: string[]; company: string[]; runtimeMinutes: number; hero: string; director: string; posterUrl: string; hintImages: string[]; hintImageKind?: string; imageSourceUrl?: string; hintSourceUrls?: string[]; hintAudioUrl?: string; description: string; source?: 'tmdb'; tmdbId?: number; titleAliases?: string[]; screenedHintImages?: string[]; }
export type Answers = Record<string, string>;
export interface Question { id: string; title: string; subtitle: string; options: { value: string; icon: string; detail?: string }[]; }
export const normalizeTitle = (value: string): string => value.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
