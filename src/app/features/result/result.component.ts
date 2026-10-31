import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { MediaImageComponent } from '../../shared/components/media-image.component';
import { StepLabelComponent } from '../../shared/components/step-label.component';
import { WatchLinksComponent } from '../../shared/components/watch-links.component';
@Component({ standalone: true, imports: [StepLabelComponent, MediaImageComponent, WatchLinksComponent], templateUrl: './result.component.html' })
export class ResultComponent implements OnDestroy {
 readonly state = inject(GameStateService);
 private readonly recommendations = inject(RecommendationService);
 private readonly router = inject(Router);
 readonly movie = computed(() => this.state.movie()!);
 readonly pieces = Array.from({ length: 25 }, (_, i) => i);
 readonly colors = ['#8053d8', '#f7b546', '#93cbbc', '#ef9479'];
 readonly busy = signal(false);
 readonly error = signal('');
 private destroyed = false;
 ngOnDestroy() { this.destroyed=true; }
 again() { this.state.reset(); this.router.navigateByUrl('/start'); }
 async another() {
  if(this.busy()) return;
  this.busy.set(true); this.error.set('');
  const detailsOnly = this.state.revealed();
  try {
   const movie=await this.recommendations.recommend({...this.state.answers()}, this.movie().id);
   if(this.destroyed) return;
   this.state.start(movie);
   if (detailsOnly) this.state.reveal();
   else await this.router.navigateByUrl('/recommendation');
  } catch(error) { if(!this.destroyed) this.error.set(error instanceof Error ? error.message : 'Unable to find another movie. Try again.'); }
  finally {if(!this.destroyed) this.busy.set(false);}
 }
}
