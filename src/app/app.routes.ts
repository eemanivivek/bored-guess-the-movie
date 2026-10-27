import { inject } from '@angular/core';
import { CanActivateFn, Routes, Router } from '@angular/router';
import { GameStateService } from './core/services/game-state.service';
const gameGuard:CanActivateFn=()=>inject(GameStateService).movie()?true:inject(Router).createUrlTree(['/start']);
const resultGuard:CanActivateFn=()=>inject(GameStateService).finished()?true:inject(Router).createUrlTree(['/game']);
export const routes:Routes=[
 {path:'start',loadComponent:()=>import('./features/start/start.component').then(m=>m.StartComponent)},
 {path:'questions',loadComponent:()=>import('./features/questionnaire/questionnaire.component').then(m=>m.QuestionnaireComponent)},
 {path:'game',canActivate:[gameGuard],loadComponent:()=>import('./features/game/game.component').then(m=>m.GameComponent)},
 {path:'result',canActivate:[gameGuard,resultGuard],loadComponent:()=>import('./features/result/result.component').then(m=>m.ResultComponent)},
 {path:'**',redirectTo:'start'}
];
