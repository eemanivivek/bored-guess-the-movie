import '@angular/compiler';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/assets/data/movies.json';
import { GameStateService } from '../src/app/core/services/game-state.service';
test('five wrong guesses end the round and prevent further changes',()=>{const state=new GameStateService();state.start(data[0]);for(let i=0;i<5;i++)assert.equal(state.guess('Unknown '+i),'wrong');assert.equal(state.attempts(),0);assert.equal(state.finished(),true);assert.equal(state.won(),false);assert.equal(state.guess(data[0].title),'empty');});
test('duplicate and blank guesses do not consume attempts',()=>{const state=new GameStateService();state.start(data[0]);assert.equal(state.guess(' ... '),'empty');state.guess('Some Movie');assert.equal(state.guess('some-movie!'),'duplicate');assert.equal(state.attempts(),4);});
test('correct title wins, another round clears history, reset clears answers',()=>{const state=new GameStateService();state.answer('mood','Bored');state.start(data[0]);assert.equal(state.guess(' MAYA BAZAR!'),'correct');assert.equal(state.won(),true);state.start(data[1]);assert.equal(state.won(),false);assert.equal(state.attempts(),5);assert.equal(state.answers()['mood'],'Bored');state.reset();assert.equal(state.movie(),null);assert.deepEqual(state.answers(),{});});

test('skipping advances the hint and consumes an attempt without inventing a guess',()=>{
 const state=new GameStateService();state.start(data[0]);
 assert.equal(state.skip(),true);assert.equal(state.attempts(),4);
 assert.deepEqual(state.turns(),[{kind:'skip'}]);assert.deepEqual(state.history(),[]);
 assert.equal(state.finished(),false);
});
test('skips and wrong guesses share the five-attempt limit; duplicate guesses remain free',()=>{
 const state=new GameStateService();state.start(data[0]);state.skip();state.guess('Unknown movie');state.skip();
 assert.equal(state.attempts(),2);assert.equal(state.turns().length,3);
 assert.equal(state.guess('unknown-movie!'),'duplicate');assert.equal(state.attempts(),2);
 assert.deepEqual(state.history(),['Unknown movie']);
 assert.equal(state.guess(data[0].title),'correct');assert.equal(state.won(),true);assert.equal(state.revealed(),false);
 assert.equal(state.skip(),false);assert.equal(state.attempts(),2);
});
test('five skips finish the round and cannot advance beyond the final hint',()=>{
 const state=new GameStateService();state.start(data[0]);for(let i=0;i<5;i++)assert.equal(state.skip(),true);
 assert.equal(state.finished(),true);assert.equal(state.attempts(),0);assert.equal(state.won(),false);
 assert.equal(state.skip(),false);assert.equal(state.reveal(),false);assert.equal(state.turns().length,5);
});
test('viewing details directly finishes without a win, loss or spent attempt',()=>{
 const state=new GameStateService();state.start(data[0]);
 assert.equal(state.reveal(),true);assert.equal(state.revealed(),true);assert.equal(state.finished(),true);
 assert.equal(state.won(),false);assert.equal(state.attempts(),5);assert.deepEqual(state.turns(),[]);
 assert.equal(state.guess(data[0].title),'empty');assert.equal(state.skip(),false);
});
test('revealing midway preserves turn history and a new recommendation resets the mode',()=>{
 const state=new GameStateService();state.answer('era','Recent');state.start(data[0]);state.skip();state.reveal();
 assert.equal(state.attempts(),4);assert.equal(state.won(),false);assert.equal(state.revealed(),true);
 state.start(data[1]);assert.equal(state.revealed(),false);assert.equal(state.finished(),false);
 assert.equal(state.attempts(),5);assert.deepEqual(state.turns(),[]);assert.equal(state.answers()['era'],'Recent');
 state.reveal();state.reset();assert.equal(state.revealed(),false);assert.equal(state.movie(),null);
});
test('skip and reveal are ignored without a movie',()=>{
 const state=new GameStateService();assert.equal(state.skip(),false);assert.equal(state.reveal(),false);assert.equal(state.attempts(),5);
});
