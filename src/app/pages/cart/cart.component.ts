import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="page-placeholder"><p>Cart — coming soon</p></div>`,
  styles: ['.page-placeholder{padding:2rem;text-align:center;color:var(--text-secondary)}']
})
export class CartComponent {}
