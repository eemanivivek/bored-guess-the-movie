import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { StepLabelComponent } from '../../shared/components/step-label.component';

@Component({
 standalone: true,
 imports: [StepLabelComponent],
 template: `
  <section class="recommendation-choice screen narrow">
   <app-step-label text="YOUR MOVIE MATCH IS READY" />
   <div class="guess-invite-icon" aria-hidden="true">🎬</div>
   <h1>Do you wanna guess the movie?</h1>
   <p class="lead">Guess from movie scenes. One chance per photo, up to five.</p>
   <p class="input-help">We check API scene photos for printed text before the game starts.</p>
   <div class="guess-invite-actions">
    <button class="button primary large" type="button" [disabled]="busy()" (click)="play()">{{busy() ? 'Loading scene photos…' : 'Yes, let’s play ↗'}}</button>
    <button class="invite-skip" type="button" (click)="reveal()" aria-describedby="invite-skip-help">Skip</button>
   </div>
   <p class="input-help" id="invite-skip-help">Skip to see the movie details.</p>
   @if(busy()){<p class="input-help" role="status">{{progress()}}</p>}
   @if(error()){<p class="feedback" role="alert">{{error()}}</p><button class="button outline" type="button" [disabled]="busy()" (click)="play()">Try more movies ↻</button>}
  </section>
 `
})
export class RecommendationComponent implements OnDestroy {
 readonly recommendations = inject(RecommendationService);
 private readonly state = inject(GameStateService);
 private readonly router = inject(Router);
 readonly busy=signal(false);
 readonly error=signal('');
 readonly progress=signal('Checking scene photos…');
 private readonly controller=new AbortController();
 private destroyed=false;
 ngOnDestroy(){this.destroyed=true;this.controller.abort();}
 async play() {
  if(this.busy() || !this.state.movie())return;
  this.busy.set(true);this.error.set('');
  try {
   const movie=await this.recommendations.preparePictureGame(this.state.answers(),this.state.movie()!,undefined,message=>{if(!this.destroyed)this.progress.set(message);},this.controller.signal);
   if(this.destroyed || this.state.finished())return;
   this.state.start(movie);await this.router.navigateByUrl('/game');
  }catch(error){if(!this.destroyed)this.error.set(error instanceof Error?error.message:'Unable to load scene photos. Please try again.');}
  finally{if(!this.destroyed)this.busy.set(false);}
 }
 reveal() { this.state.reveal(); this.router.navigateByUrl('/result'); }
}
