import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { StepLabelComponent } from '../../shared/components/step-label.component';
import { QUESTIONS } from '../../core/models/questions.data';
@Component({standalone:true,imports:[StepLabelComponent],template:`
 <section class="welcome screen"><div class="welcome-copy"><app-step-label text="YOUR NEXT MOVIE STARTS WITH A LITTLE MYSTERY"/>
 <h1>Bored?<br>Let’s make it<br><span class="title-highlight">a movie night.</span><span class="title-spark">✳</span></h1>
 <p class="lead">Tell us your vibe. We’ll pick a Telugu movie.<br>Here’s the twist — you have to guess it first.</p>
 <button class="button primary large" (click)="start()">Let’s play <span>↗</span></button><div class="start-caption">{{questionCount}} quick questions <span>•</span> 5 guesses <span>•</span> Endless cinema</div>
 <div class="movie-fans"><div class="avatar-stack"><span>😎</span><span>🤩</span><span>🥳</span></div><div><b>For the pakka movie lover.</b><small>And the “just one more hint” person.</small></div></div></div>
 <div class="welcome-art" aria-label="Illustrated mystery movie ticket"><span class="floating-note">A blockbuster for every mood ↴</span><div class="orbit orbit-one"></div><span class="art-star star-one">✦</span><span class="art-star star-two">✳</span>
 <div class="cinema-ticket"><div class="ticket-top"><span>BORED? ORIGINALS</span><span>ADMIT ONE</span></div><div class="ticket-picture"><div class="moon"></div><div class="mountain back"></div><div class="mountain front"></div><span class="picture-grain"></span><span class="mystery-mark">?</span><span class="picture-caption">A LITTLE MYSTERY.<br>A LOT OF CINEMA.</span><span class="film-tag">35mm</span></div><div class="ticket-bottom"><div><small>TONIGHT’S FEATURE</small><b>Your next favourite.</b></div><span class="ticket-arrow">↗</span></div><div class="ticket-stub"><span>✦ THE VIBE IS YOURS. THE MOVIE IS A MYSTERY.</span><div class="barcode"></div></div></div>
 <div class="hint-sticker"><span>🍿</span> No scrolling.<br><b>Just guessing.</b></div><span class="art-scribble">Telugu cinema,<br>with a twist.</span></div></section>
 <section class="how-it-works"><div class="how-heading"><span class="eyebrow">THE PLOT IS SIMPLE</span><h2>Less scrolling. More playing.</h2></div><div class="how-step"><span class="step-num">01</span><div><h3>Set the mood</h3><p>A few questions to find your vibe.</p></div></div><div class="how-step"><span class="step-num mint">02</span><div><h3>Connect the clues</h3><p>Look at the hints. Take your shot.</p></div></div><div class="how-step"><span class="step-num peach">03</span><div><h3>Meet your movie</h3><p>A recommendation worth the reveal.</p></div></div></section>`})
export class StartComponent { readonly questionCount=QUESTIONS.length;private router=inject(Router);private state=inject(GameStateService);start(){this.state.reset();this.router.navigateByUrl('/questions');} }
