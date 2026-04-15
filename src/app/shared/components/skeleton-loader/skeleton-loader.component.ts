import { Component, Input } from '@angular/core';

@Component({
  selector: 'bb-skeleton',
  standalone: true,
  template: `<div class="skeleton" [style.width]="width" [style.height]="height" [class.skeleton--circle]="circle"></div>`,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--border) 25%, var(--surface-alt) 50%, var(--border) 75%);
      background-size: 200% 100%;
      border-radius: var(--radius-sm);
      animation: shimmer 1.4s infinite;
      display: block;
    }
    .skeleton--circle { border-radius: 50%; }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonLoaderComponent {
  @Input() width  = '100%';
  @Input() height = '1rem';
  @Input() circle = false;
}
