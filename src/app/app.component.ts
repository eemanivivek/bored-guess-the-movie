import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
@Component({selector:'app-root',standalone:true,imports:[RouterLink,RouterOutlet],template:`
 <header class="site-header"><a class="brand" routerLink="/start"><span class="brand-icon">▶</span><span>bored<span class="purple">?</span><small>GUESS THE MOVIE</small></span></a><div class="header-note"><span class="status-dot"></span> TELUGU CINEMA. YOUR VIBE.</div><span class="language">అ <span>తెలుగు</span></span></header>
 <main><router-outlet /></main>
 <footer><span>Made for the love of <b>Telugu cinema.</b> <span class="footer-star">✦</span></span><span>A little bored. A little filmy.</span></footer>
 <div class="tmdb-credit"><a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">Movie data: TMDB</a><span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span></div>`})
export class AppComponent {}
