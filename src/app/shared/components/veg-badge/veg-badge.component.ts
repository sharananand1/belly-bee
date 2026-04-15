import { Component, Input } from '@angular/core';

@Component({
  selector: 'bb-veg-badge',
  standalone: true,
  template: `
    <span class="bb-veg-box" [class.bb-veg-box--nonveg]="!isVeg"
          [title]="isVeg ? 'Vegetarian' : 'Non-Vegetarian'"
          [attr.aria-label]="isVeg ? 'Vegetarian' : 'Non-Vegetarian'">
      <span class="bb-veg-dot"></span>
    </span>
  `,
  styles: [`
    /* Scoped class names — avoid clash with global .veg-dot utility */
    .bb-veg-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border: 1.5px solid #27AE60;
      border-radius: 3px;
      flex-shrink: 0;
    }
    /* Non-veg: red square border */
    .bb-veg-box--nonveg { border-color: #E84444; }

    /* Inner filled circle */
    .bb-veg-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #27AE60;
    }
    /* Non-veg inner dot: red */
    .bb-veg-box--nonveg .bb-veg-dot { background: #E84444; }
  `],
})
export class VegBadgeComponent {
  @Input() isVeg = true;
}
