import { Component, Input } from '@angular/core';
@Component({selector:'app-step-label',standalone:true,template:`<div class="eyebrow"><span class="tiny-star">✦</span> {{text}}</div>`})
export class StepLabelComponent { @Input() text=''; }
