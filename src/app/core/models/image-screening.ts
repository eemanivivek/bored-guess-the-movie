import { normalizeTitle } from './movie';

export interface OcrWord { text:string;confidence:number;width:number;height:number; }

export function parseOcrWords(tsv:string): OcrWord[] {
 return tsv.split('\n').slice(1).flatMap(line=>{
  const cells=line.trimEnd().split('\t');
  return cells[0]==='5' && cells.length>=12 ? [{text:cells.slice(11).join(' ').trim(),confidence:Number(cells[10]),width:Number(cells[8]),height:Number(cells[9])}] : [];
 });
}

/** Conservative: reject readable lettering, not just an exact English title match. */
export function hasPrintedText(words: readonly OcrWord[], titles: readonly string[] = []): boolean {
 const readable=words.filter(word=>Number.isFinite(word.confidence)&&word.confidence>=10);
 const combined=normalizeTitle(readable.map(word=>word.text).join(' '));
 if(titles.some(title=>normalizeTitle(title).length>=3 && combined.includes(normalizeTitle(title)))) return true;
 return readable.some(word=>{
  const letters=word.text.match(/\p{L}/gu) ?? [];
  const telugu=word.text.match(/\p{Script=Telugu}/gu) ?? [];
  return letters.length>=2 && word.confidence>=45
   || letters.length>=3 && word.confidence>=20 && word.height>=18
   || telugu.length>=2 && word.confidence>=25 && word.height>=12;
 });
}
