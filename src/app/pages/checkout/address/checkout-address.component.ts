import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-address',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="page-placeholder"><p>Checkout — Address — coming soon</p></div>`,
  styles: ['.page-placeholder{padding:2rem;text-align:center;color:var(--text-secondary)}']
})
export class CheckoutAddressComponent {}
