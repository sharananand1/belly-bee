import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bb-rating-stars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="stars" [title]="value + ' out of 5'">
      <span class="material-icons-round stars__icon" [class.stars__icon--filled]="value >= 1">star</span>
      <span class="material-icons-round stars__icon" [class.stars__icon--filled]="value >= 2">star</span>
      <span class="material-icons-round stars__icon" [class.stars__icon--filled]="value >= 3">star</span>
      <span class="material-icons-round stars__icon" [class.stars__icon--filled]="value >= 4">star</span>
      <span class="material-icons-round stars__icon" [class.stars__icon--filled]="value >= 5">star</span>
      @if (showValue) { <span class="stars__value">{{ value }}</span> }
    </span>
  `,
  styles: [`
    .stars { display: inline-flex; align-items: center; gap: 1px; }
    /* var(--border-dark) = #D9D0C0 light / #3A3A3A dark — visible in both themes */
    .stars__icon { font-size: .95rem; color: var(--border-dark); }
    .stars__icon--filled { color: #F5A623; }
    .stars__value { font-size: .8rem; font-weight: 600; color: var(--text-secondary); margin-left: 3px; }
  `],
})
export class RatingStarsComponent {
  @Input() value = 0;
  @Input() showValue = true;
}
