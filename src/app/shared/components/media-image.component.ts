import { Component, Input, OnChanges, signal } from '@angular/core';

@Component({
 selector: 'app-media-image',
 standalone: true,
 template: `
  <img [src]="failed() ? fallback : src" [alt]="alt" [style.object-fit]="fit"
    referrerpolicy="no-referrer" (error)="onError()" />
  @if (failed()) { <span class="media-fallback" role="status">Online image unavailable · showing a local clue</span> }
 `,
 styles: [`
  :host { display:block; width:100%; height:100%; position:relative; overflow:hidden; border-radius:inherit; }
  img { display:block; width:100%; height:100%; object-fit:cover; }
  .media-fallback { position:absolute; top:48px; left:12px; right:12px; padding:8px; color:white; background:#282634dc; font:11px/1.5 'Segoe UI',sans-serif; border-radius:5px; }
 `]
})
export class MediaImageComponent implements OnChanges {
 @Input({required:true}) src = '';
 @Input({required:true}) fallback = '';
 @Input() alt = '';
 @Input() fit: 'cover' | 'contain' = 'cover';
 readonly failed = signal(false);
 ngOnChanges() { this.failed.set(false); }
 onError() { if (!this.failed()) this.failed.set(true); }
}
