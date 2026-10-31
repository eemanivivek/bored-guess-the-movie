import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WATCH_PLATFORMS } from '../../core/models/watch-link';
import { WatchLinksService } from '../../core/services/watch-links.service';

@Component({
 selector: 'app-watch-links',
 standalone: true,
 imports: [DatePipe],
 template: `
  <section class="watch-section" aria-labelledby="watch-heading">
   <div class="watch-heading"><h3 id="watch-heading">Where to watch</h3><span class="watch-language">తెలుగు · Telugu</span></div>
   @if (links().length) {
    <p class="watch-intro">Find this movie in Telugu on these platforms.</p>
    <div class="watch-platforms">
     @for (link of links(); track link.platform) {
      <a class="watch-platform" [href]="link.url" target="_blank" rel="noopener noreferrer"
       [attr.aria-label]="'Find ' + movieTitle() + ' in Telugu on ' + platforms[link.platform].name + ' (opens in a new tab)'">
       <img [src]="'assets/platforms/' + platforms[link.platform].icon + '.svg'" alt="" width="42" height="42" />
       <span><b>{{platforms[link.platform].name}}</b><small>{{link.note || 'Telugu audio'}}</small></span>
       <span class="watch-arrow" aria-hidden="true">↗</span>
      </a>
     }
    </div>
    <p class="watch-footnote">Telugu listings checked {{(checkedAt() + 'T00:00:00Z') | date:'d MMM y':'UTC'}}. Availability varies by country; a subscription or rental may be needed.</p>
   } @else {
    <div class="watch-empty"><span aria-hidden="true">🎞️</span><p>We couldn’t verify a Telugu streaming link for this movie yet.<small>Check back later for a Telugu viewing option.</small></p></div>
   }
  </section>
 `,
 styleUrl: './watch-links.component.scss'
})
export class WatchLinksComponent {
 readonly movieId = input.required<number>();
 readonly movieTitle = input.required<string>();
 readonly movieYear = input<number>();
 readonly platforms = WATCH_PLATFORMS;
 private readonly service = inject(WatchLinksService);
 readonly links = computed(() => this.service.forMovie(this.movieId(),this.movieTitle(),this.movieYear()));
 readonly checkedAt = computed(() => this.links().map(link => link.checkedAt).sort()[0]);
}
