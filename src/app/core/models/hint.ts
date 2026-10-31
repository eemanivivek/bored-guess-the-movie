import { Movie } from './movie';
import { safeRoundImages } from './screened-scenes';

export type Hint = {kind:'image';src:string;index:number} | {kind:'unavailable'};

export function movieHint(movie: Movie, turn: number): Hint {
 const images=safeRoundImages(movie);
 const index=Math.min(Math.max(0,turn),images.length-1);
 if(images[index]) return {kind:'image',src:images[index],index};
 return {kind:'unavailable'};
}
