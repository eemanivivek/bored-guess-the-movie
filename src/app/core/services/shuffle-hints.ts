/** Fisher–Yates: copy the deck so a round cannot mutate the shared catalogue. */
export function shuffleHints(images: readonly string[], random = Math.random): string[] {
 const shuffled = [...new Set(images)];
 for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
 }
 return shuffled;
}
