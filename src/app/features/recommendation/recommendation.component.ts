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
   <h1>A little mystery, or the big reveal?</h1>
   <p class="lead">We’ve found a movie for your vibe. Choose how you’d like to meet it.</p>
   <div class="choice-cards">
    <button class="choice-card" (click)="play()">
     <span class="choice-icon" aria-hidden="true">🎬</span>
     <h2>Play guessing game</h2>
     <p>Connect the scene clues and guess the title. You have five attempts.</p>
     <span class="choice-action">Let’s play ↗</span>
    </button>
    <button class="choice-card" (click)="reveal()">
     <span class="choice-icon" aria-hidden="true">🍿</span>
     <h2>Show movie details</h2>
     <p>Go straight to the poster, story, cast and details of your movie match.</p>
     <span class="choice-action">Reveal my movie ↗</span>
    </button>
   </div>
   <p class="input-help">The guessing game is optional. Both options use the same recommendation.</p>
  </section>
 `
})
export class RecommendationComponent {
 private readonly state = inject(GameStateService);
 private readonly router = inject(Router);
 play() { this.router.navigateByUrl('/game'); }
 reveal() { this.state.reveal(); this.router.navigateByUrl('/result'); }
}
