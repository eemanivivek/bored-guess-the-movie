import { inject } from '@angular/core';
import { CanActivateFn, Routes, Router } from '@angular/router';
import { GameStateService } from './core/services/game-state.service';
import { hasPlayableScenes } from './core/models/screened-scenes';
const movieGuard: CanActivateFn = () => inject(GameStateService).movie() ? true : inject(Router).createUrlTree(['/start']);
const playingGuard: CanActivateFn = () => inject(GameStateService).finished() ? inject(Router).createUrlTree(['/result']) : true;
const resultGuard: CanActivateFn = () => inject(GameStateService).finished() ? true : inject(Router).createUrlTree(['/recommendation']);
const sceneGuard: CanActivateFn = () => { const movie=inject(GameStateService).movie(); return movie && hasPlayableScenes(movie) ? true : inject(Router).createUrlTree(['/recommendation']); };
export const routes: Routes = [
 { path: 'start', loadComponent: () => import('./features/start/start.component').then(m => m.StartComponent) },
 { path: 'questions', loadComponent: () => import('./features/questionnaire/questionnaire.component').then(m => m.QuestionnaireComponent) },
 { path: 'recommendation', canActivate: [movieGuard, playingGuard], loadComponent: () => import('./features/recommendation/recommendation.component').then(m => m.RecommendationComponent) },
 { path: 'game', canActivate: [movieGuard, playingGuard, sceneGuard], loadComponent: () => import('./features/game/game.component').then(m => m.GameComponent) },
 { path: 'result', canActivate: [movieGuard, resultGuard], loadComponent: () => import('./features/result/result.component').then(m => m.ResultComponent) },
 { path: '**', redirectTo: 'start' }
];
