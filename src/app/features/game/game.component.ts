import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { movieHint } from '../../core/models/hint';
import { safeRoundImages } from '../../core/models/screened-scenes';
import { GameStateService } from '../../core/services/game-state.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { MediaImageComponent } from '../../shared/components/media-image.component';
import { StepLabelComponent } from '../../shared/components/step-label.component';
@Component({ standalone: true, imports: [FormsModule, StepLabelComponent, MediaImageComponent], templateUrl: './game.component.html' })
export class GameComponent {
 readonly state = inject(GameStateService);
 private readonly recommendations = inject(RecommendationService);
 private readonly router = inject(Router);
 readonly maxAttempts = this.state.maxAttempts;
 readonly hearts = computed(() => Array.from({ length: this.maxAttempts() }, (_, index) => index + 1));
 readonly guess = signal('');
 readonly message = signal('');
 readonly movie = computed(() => this.state.movie()!);
 readonly sceneCount = computed(() => safeRoundImages(this.movie()).length);
 readonly currentHint = computed(() => Math.min(this.state.turns().length + 1, this.sceneCount()));
 readonly hint = computed(() => movieHint(this.movie(),this.state.turns().length));
 readonly fallbackHint = 'assets/images/clue-unavailable.svg';
 readonly suggestions = signal<string[]>([]);
 constructor() {
  toObservable(this.guess).pipe(debounceTime(250),distinctUntilChanged(),
   switchMap(query=>this.recommendations.suggest(query)),takeUntilDestroyed())
   .subscribe(titles=>this.suggestions.set(titles));
 }
 submit() {
  const result = this.state.guess(this.guess());
  if (result === 'duplicate') { this.message.set('You already tried that title. Give another one a shot.'); return; }
  if (result === 'empty') { this.message.set('Enter a movie title to take a guess.'); return; }
  this.advance('Not quite. Try another title.');
 }
 skip() { if (this.state.skip()) this.advance('Hint skipped.'); }
 reveal() { this.state.reveal(); this.router.navigateByUrl('/result'); }
 prepareScenes() { this.router.navigateByUrl('/recommendation'); }
 private advance(message: string) {
  this.guess.set('');
  if (this.state.finished()) this.router.navigateByUrl('/result');
  else this.message.set(message);
 }
}
