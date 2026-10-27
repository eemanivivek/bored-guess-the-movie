import '@angular/compiler';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/assets/data/movies.json';
import { GameStateService } from '../src/app/core/services/game-state.service';
test('five wrong guesses end the round and prevent further changes',()=>{const state=new GameStateService();state.start(data[0]);for(let i=0;i<5;i++)assert.equal(state.guess('Unknown '+i),'wrong');assert.equal(state.attempts(),0);assert.equal(state.finished(),true);assert.equal(state.won(),false);assert.equal(state.guess(data[0].title),'empty');});
test('duplicate and blank guesses do not consume attempts',()=>{const state=new GameStateService();state.start(data[0]);assert.equal(state.guess(' ... '),'empty');state.guess('Some Movie');assert.equal(state.guess('some-movie!'),'duplicate');assert.equal(state.attempts(),4);});
test('correct title wins, another round clears history, reset clears answers',()=>{const state=new GameStateService();state.answer('mood','Bored');state.start(data[0]);assert.equal(state.guess(' MAYA BAZAR!'),'correct');assert.equal(state.won(),true);state.start(data[1]);assert.equal(state.won(),false);assert.equal(state.attempts(),5);assert.equal(state.answers()['mood'],'Bored');state.reset();assert.equal(state.movie(),null);assert.deepEqual(state.answers(),{});});
