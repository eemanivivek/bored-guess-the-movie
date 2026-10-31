import { computed, Injectable, signal } from '@angular/core';
import { MAX_ATTEMPTS, GameTurn } from '../models/game';
import { Answers, Movie, normalizeTitle } from '../models/movie';
import { shuffleHints } from './shuffle-hints';
import { safeRoundImages } from '../models/screened-scenes';

@Injectable({ providedIn: 'root' })
export class GameStateService {
 private readonly answerState = signal<Answers>({});
 readonly answers = this.answerState.asReadonly();
 private readonly movieState = signal<Movie | null>(null);
 readonly movie = this.movieState.asReadonly();
 private readonly turnState = signal<GameTurn[]>([]);
 readonly turns = this.turnState.asReadonly();
 readonly history = computed(() => this.turns().flatMap(turn => turn.kind === 'guess' ? [turn.value] : []));
 private readonly wonState = signal(false);
 readonly won = this.wonState.asReadonly();
 private readonly revealedState = signal(false);
 readonly revealed = this.revealedState.asReadonly();
 readonly maxAttempts = computed(() => {
  const movie=this.movie();
  return movie?.screenedHintImages ? safeRoundImages(movie).length : MAX_ATTEMPTS;
 });
 readonly attempts = computed(() => Math.max(0,this.maxAttempts() - this.turns().length));
 readonly finished = computed(() => this.won() || this.revealed() || this.attempts() === 0);

 answer(id: string, value: string) { this.answerState.update(answers => ({ ...answers, [id]: value })); }
 start(movie: Movie) {
  this.movieState.set({ ...movie, hintImages: shuffleHints(movie.screenedHintImages ? safeRoundImages(movie) : movie.hintImages) });
  this.turnState.set([]);
  this.wonState.set(false);
  this.revealedState.set(false);
 }
 guess(value: string): 'correct' | 'wrong' | 'duplicate' | 'empty' {
  const normalized = normalizeTitle(value);
  if (!normalized || !this.movie() || this.finished()) return 'empty';
  if (this.history().some(guess => normalizeTitle(guess) === normalized)) return 'duplicate';
  if ([this.movie()!.title,...(this.movie()!.titleAliases ?? [])].some(title=>normalized === normalizeTitle(title))) { this.wonState.set(true); return 'correct'; }
  this.turnState.update(turns => [...turns, { kind: 'guess', value: value.trim() }]);
  return 'wrong';
 }
 skip(): boolean {
  if (!this.movie() || this.finished()) return false;
  this.turnState.update(turns => [...turns, { kind: 'skip' }]);
  return true;
 }
 reveal(): boolean {
  if (!this.movie() || this.finished()) return false;
  this.revealedState.set(true);
  return true;
 }
 reset() {
  this.answerState.set({}); this.movieState.set(null); this.turnState.set([]);
  this.wonState.set(false); this.revealedState.set(false);
 }
}
