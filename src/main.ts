import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withViewTransitions } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
bootstrapApplication(AppComponent, { providers: [provideHttpClient(), provideRouter(routes, withViewTransitions())] }).catch(console.error);
