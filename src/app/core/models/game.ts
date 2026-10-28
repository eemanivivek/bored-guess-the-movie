export const MAX_ATTEMPTS = 5;
export type GameTurn = { kind: 'guess'; value: string } | { kind: 'skip' };
