import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { MediaImageComponent } from '../../shared/components/media-image.component';
import { StepLabelComponent } from '../../shared/components/step-label.component';
@Component({ standalone: true, imports: [StepLabelComponent, MediaImageComponent], templateUrl: './result.component.html' })
export class ResultComponent {
 readonly state = inject(GameStateService);
 private readonly recommendations = inject(RecommendationService);
 private readonly router = inject(Router);
 readonly movie = computed(() => this.state.movie()!);
 readonly pieces = Array.from({ length: 25 }, (_, i) => i);
 readonly colors = ['#8053d8', '#f7b546', '#93cbbc', '#ef9479'];
 again() { this.state.reset(); this.router.navigateByUrl('/start'); }
 another() {
  const detailsOnly = this.state.revealed();
  this.state.start(this.recommendations.recommend(this.state.answers(), this.movie().id));
  if (detailsOnly) this.state.reveal();
  else this.router.navigateByUrl('/recommendation');
 }
}
