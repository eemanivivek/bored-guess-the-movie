import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { StepLabelComponent } from '../../shared/components/step-label.component';

@Component({
 standalone: true,
 imports: [StepLabelComponent],
 template: `
  <section class="recommendation-choice screen narrow">
   <app-step-label text="YOUR MOVIE MATCH IS READY" />
   <div class="guess-invite-icon" aria-hidden="true">🎬</div>
   <h1>Do you wanna guess the movie?</h1>
   <p class="lead">Five hints. Five chances. Take a guess?</p>
   <div class="guess-invite-actions">
    <button class="button primary large" type="button" (click)="play()">Yes, let’s play ↗</button>
    <button class="invite-skip" type="button" (click)="reveal()" aria-describedby="invite-skip-help">Skip</button>
   </div>
   <p class="input-help" id="invite-skip-help">Skip to see the movie details.</p>
  </section>
 `
})
export class RecommendationComponent {
 private readonly state = inject(GameStateService);
 private readonly router = inject(Router);
 play() { this.router.navigateByUrl('/game'); }
 reveal() { this.state.reveal(); this.router.navigateByUrl('/result'); }
}
