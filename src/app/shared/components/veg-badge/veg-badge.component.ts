import { Component, Input } from '@angular/core';

@Component({
  selector: 'bb-veg-badge',
  standalone: true,
  template: `
    <span class="veg-dot" [class.veg-dot--nonveg]="!isVeg" [title]="isVeg ? 'Vegetarian' : 'Non-Vegetarian'">
      <span class="veg-dot__inner"></span>
    </span>
  `,
  styles: [`
    .veg-dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border: 1.5px solid #27AE60;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .veg-dot--nonveg { border-color: var(--accent); }

    .veg-dot__inner {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #27AE60;
    }
    .veg-dot--nonveg .veg-dot__inner { background: var(--accent); }
  `],
})
export class VegBadgeComponent {
  @Input() isVeg = true;
}
