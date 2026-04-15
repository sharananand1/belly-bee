import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bb-price',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="price">
      @if (discountPercent > 0) {
        <span class="price__original">₹{{ original }}</span>
      }
      <span class="price__current">₹{{ discounted }}</span>
      @if (discountPercent > 0) {
        <span class="price__badge">{{ discountPercent }}% off</span>
      }
    </span>
  `,
  styles: [`
    .price { display: inline-flex; align-items: baseline; gap: .35rem; flex-wrap: wrap; }
    .price__original { font-size: .8rem; color: var(--text-secondary); text-decoration: line-through; }
    .price__current { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
    .price__badge { font-size: .7rem; font-weight: 700; color: #27AE60; background: rgba(39,174,96,.12); padding: 1px 5px; border-radius: 4px; }
  `],
})
export class PriceDisplayComponent {
  @Input() original = 0;
  @Input() discountPercent = 0;

  get discounted(): number {
    if (!this.discountPercent) return this.original;
    return Math.round(this.original * (1 - this.discountPercent / 100));
  }
}
