import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="page-placeholder"><p>Home page — coming soon</p></div>`,
  styles: ['.page-placeholder{padding:2rem;text-align:center;color:var(--text-secondary)}']
})
export class HomeComponent {}
