import { Component, AfterViewInit, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css',
})
export class PrivacyComponent implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit(): void {
    const sections = (this.el.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.legal-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.animate(
              [{ opacity: '0', transform: 'translateY(16px)' }, { opacity: '1', transform: 'translateY(0)' }],
              { duration: 400, easing: 'ease-out', fill: 'forwards' }
            );
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px' }
    );
    sections.forEach(section => observer.observe(section));
  }
}
