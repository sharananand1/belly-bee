import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="nf-wrap">
      <div class="nf-emoji">🐝</div>
      <h1 class="nf-title">404</h1>
      <p class="nf-msg">Oops! This page buzzed off somewhere.</p>
      <a routerLink="/main" class="btn btn-primary">Back to Home</a>
    </div>
  `,
  styles: [`
    .nf-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center;
               min-height:60vh; gap:1rem; text-align:center; padding:2rem; }
    .nf-emoji { font-size:4rem; }
    .nf-title { font-family:var(--font-heading); font-size:5rem; color:var(--primary); margin:0; }
    .nf-msg   { color:var(--text-secondary); font-size:1.1rem; }
  `]
})
export class NotFoundComponent {}
