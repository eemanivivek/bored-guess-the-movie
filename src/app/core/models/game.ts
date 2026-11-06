export const MAX_ATTEMPTS = 5;
export const MIN_SCENE_PHOTOS = 2;
export type GameTurn = { kind: 'guess'; value: string } | { kind: 'skip' };
