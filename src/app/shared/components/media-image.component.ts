import { Component, Input, OnChanges, signal } from '@angular/core';

@Component({
 selector: 'app-media-image',
 standalone: true,
 template: `
  @if (failed() && sceneOnly) {
   <div class="scene-unavailable" role="status"><p>This scene photo couldn’t load.</p><button type="button" (click)="failed.set(false)">Retry photo ↻</button></div>
  } @else {
   <img [src]="failed() ? fallback : src" [alt]="alt" [style.object-fit]="fit"
     referrerpolicy="no-referrer" (error)="onError()" />
   @if (failed()) { <span class="media-fallback" role="status">Online image unavailable · showing a local clue</span> }
  }
 `,
 styles: [`
  :host { display:block; width:100%; height:100%; position:relative; overflow:hidden; border-radius:inherit; }
  img { display:block; width:100%; height:100%; object-fit:cover; }
  .media-fallback { position:absolute; top:48px; left:12px; right:12px; padding:8px; color:white; background:#282634dc; font:11px/1.5 'Segoe UI',sans-serif; border-radius:5px; }
  .scene-unavailable { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:45px 25px; text-align:center; color:#fff9eb; background:#302845; }
  .scene-unavailable p { margin:0; font-size:14px; }
  .scene-unavailable button { border:1px solid #c5afe8; border-radius:8px; color:#fff9eb; background:transparent; padding:10px 16px; font-size:12px; }
 `]
})
export class MediaImageComponent implements OnChanges {
 @Input({required:true}) src = '';
 @Input({required:true}) fallback = '';
 @Input() alt = '';
 @Input() fit: 'cover' | 'contain' = 'cover';
 @Input() sceneOnly = false;
 readonly failed = signal(false);
 ngOnChanges() { this.failed.set(false); }
 onError() { if (!this.failed()) this.failed.set(true); }
}
