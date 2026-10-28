import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MAX_ATTEMPTS } from '../../core/models/game';
import { normalizeTitle } from '../../core/models/movie';
import { GameStateService } from '../../core/services/game-state.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { MediaImageComponent } from '../../shared/components/media-image.component';
import { StepLabelComponent } from '../../shared/components/step-label.component';
@Component({ standalone: true, imports: [FormsModule, StepLabelComponent, MediaImageComponent], templateUrl: './game.component.html' })
export class GameComponent {
 readonly state = inject(GameStateService);
 private readonly recommendations = inject(RecommendationService);
 private readonly router = inject(Router);
 readonly maxAttempts = MAX_ATTEMPTS;
 readonly hearts = Array.from({ length: MAX_ATTEMPTS }, (_, index) => index + 1);
 readonly guess = signal('');
 readonly message = signal('');
 readonly movie = computed(() => this.state.movie()!);
 readonly currentHint = computed(() => Math.min(this.state.turns().length + 1, MAX_ATTEMPTS));
 readonly frameIndex = computed(() => Math.min(this.state.turns().length, this.movie().hintImages.length - 1));
 readonly fallbackHint = computed(() => 'assets/images/movie-' + this.movie().id + '-hint-' + (this.frameIndex() % 3 + 1) + '.svg');
 readonly audioMode = computed(() => !!this.movie().hintAudioUrl && this.state.turns().length % 2 === 1);
 readonly suggestions = computed(() => {
  const query = normalizeTitle(this.guess());
  return query ? this.recommendations.movies.filter(movie => normalizeTitle(movie.title).includes(query)).slice(0, 5).map(movie => movie.title) : [];
 });
 submit() {
  const result = this.state.guess(this.guess());
  if (result === 'duplicate') { this.message.set('You already tried that title. Give another one a shot.'); return; }
  if (result === 'empty') { this.message.set('Enter a movie title to take a guess.'); return; }
  this.advance('Not quite! A new clue is ready.');
 }
 skip() { if (this.state.skip()) this.advance('Hint skipped. Your next clue is ready.'); }
 reveal() { this.state.reveal(); this.router.navigateByUrl('/result'); }
 private advance(message: string) {
  this.guess.set('');
  if (this.state.finished()) this.router.navigateByUrl('/result');
  else this.message.set(message);
 }
}
