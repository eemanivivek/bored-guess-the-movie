import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QUESTIONS } from '../../core/models/questions.data';
import { GameStateService } from '../../core/services/game-state.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { StepLabelComponent } from '../../shared/components/step-label.component';

@Component({
 standalone:true,
 imports:[StepLabelComponent],
 template:`
 <section class="quiz screen narrow" [attr.aria-busy]="busy()">
  <app-step-label text="FIRST, LET’S FIND YOUR VIBE"/>
  <div class="progress-meta"><span>THE MOOD BOARD</span><span>Question {{index()+1}} <span class="muted">/ {{questions.length}}</span></span></div>
  <div class="progress-track" role="progressbar" [attr.aria-valuenow]="index()+1" aria-valuemin="0" [attr.aria-valuemax]="questions.length" aria-label="Question progress"><div [style.width.%]="(index()+1)/questions.length*100"></div></div>
  <h1>{{question().title}}</h1><p class="lead">{{question().subtitle}}</p>
  @if(error()){<p class="feedback" role="alert">{{error()}}</p>}
  <div class="options" role="group" [attr.aria-label]="question().title">
   @for(option of question().options;track option.value){
    <button class="option" [disabled]="busy()" [class.selected]="state.answers()[question().id]===option.value" [attr.aria-pressed]="state.answers()[question().id]===option.value" (click)="state.answer(question().id,option.value)">
     <span class="option-icon">{{option.icon}}</span><span><b>{{option.value}}</b>@if(option.detail){<small>{{option.detail}}</small>}</span><span class="radio-dot"></span>
    </button>
   }
  </div>
  <div class="quiz-nav">
   <button class="button subtle" [disabled]="busy()" (click)="back()">← Back</button>
   <span class="quiz-footnote">Trust your first instinct. ✦</span>
   <button class="button primary" [disabled]="busy() || !state.answers()[question().id]" (click)="next()">{{busy() ? 'Finding your movie…' : index()===questions.length-1 ? 'Find my movie →' : 'Next question →'}}</button>
  </div>
  @if(busy()){<p class="input-help" role="status">Looking for your next movie night…</p>}
 </section>`
})
export class QuestionnaireComponent implements OnDestroy {
 readonly questions=QUESTIONS;
 readonly index=signal(0);
 readonly error=signal('');
 readonly busy=signal(false);
 readonly question=computed(()=>this.questions[this.index()]);
 readonly state=inject(GameStateService);
 private readonly rec=inject(RecommendationService);
 private readonly router=inject(Router);
 private destroyed=false;
 ngOnDestroy(){this.destroyed=true;}
 back(){
  if(this.busy()) return;
  this.error.set('');
  if(this.index()) this.index.update(n=>n-1);
  else this.router.navigateByUrl('/start');
 }
 async next(){
  if(this.busy() || !this.state.answers()[this.question().id]) return;
  this.error.set('');
  if(this.index()<this.questions.length-1){this.index.update(n=>n+1);return;}
  this.busy.set(true);
  try {
   const movie=await this.rec.recommend({...this.state.answers()});
   if(this.destroyed) return;
   this.state.start(movie);
   await this.router.navigateByUrl('/recommendation');
  } catch(error) {
   if(!this.destroyed) this.error.set(error instanceof Error ? error.message : 'Unable to find a movie. Please choose another era.');
  } finally {if(!this.destroyed) this.busy.set(false);}
 }
}
