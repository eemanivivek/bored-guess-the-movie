import { Injectable } from '@angular/core';
import data from '../../../assets/data/movies.json';
import { Answers, Movie } from '../models/movie';
import { selectMovie } from './recommendation';
@Injectable({providedIn:'root'})
export class RecommendationService {
 readonly movies: Movie[] = data;
 recommend(answers: Answers, excludeId?: number): Movie { return selectMovie(this.movies,answers,excludeId); }
}
