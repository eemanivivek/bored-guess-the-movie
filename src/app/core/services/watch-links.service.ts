import { Injectable } from '@angular/core';
import links from '../../../assets/data/watch-links.json';
import { isTeluguWatchLink, WatchLink } from '../models/watch-link';
import catalogue from '../../../assets/data/movies.json';
import { normalizeTitle } from '../models/movie';

@Injectable({ providedIn: 'root' })
export class WatchLinksService {
 private readonly links: WatchLink[] = links as WatchLink[];
 forMovie(movieId: number,title?:string,year?:number): WatchLink[] {
  // Local metadata is used only to attach previously verified OTT links, never to select movies.
  const id=movieId>0?movieId:catalogue.find(movie=>movie.year===year&&normalizeTitle(movie.title)===normalizeTitle(title ?? ''))?.id;
  return this.links.filter(link => link.movieId === id && isTeluguWatchLink(link));
 }
}
