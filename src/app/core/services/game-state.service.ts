import { computed, Injectable, signal } from '@angular/core';
import { Answers, Movie, normalizeTitle } from '../models/movie';
import { shuffleHints } from './shuffle-hints';
@Injectable({providedIn:'root'})
export class GameStateService {
 private readonly answerState=signal<Answers>({}); readonly answers=this.answerState.asReadonly();
 private readonly movieState=signal<Movie|null>(null); readonly movie=this.movieState.asReadonly();
 private readonly historyState=signal<string[]>([]); readonly history=this.historyState.asReadonly();
 private readonly wonState=signal(false); readonly won=this.wonState.asReadonly();
 readonly attempts=computed(()=>5-this.history().length); readonly finished=computed(()=>this.won()||this.attempts()===0);
 answer(id:string,value:string) { this.answerState.update(a=>({...a,[id]:value})); }
 start(movie:Movie) { this.movieState.set({...movie,hintImages:shuffleHints(movie.hintImages)}); this.historyState.set([]); this.wonState.set(false); }
 guess(value:string): 'correct'|'wrong'|'duplicate'|'empty' {
  const normalized=normalizeTitle(value); if(!normalized||!this.movie()||this.finished()) return 'empty';
  if(this.history().some(g=>normalizeTitle(g)===normalized)) return 'duplicate';
  if(normalized===normalizeTitle(this.movie()!.title)) {this.wonState.set(true);return 'correct';}
  this.historyState.update(h=>[...h,value.trim()]); return 'wrong';
 }
 reset(){this.answerState.set({});this.movieState.set(null);this.historyState.set([]);this.wonState.set(false);}
}
