import {
  Component, inject, signal, computed,
  AfterViewInit, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { animate, stagger } from 'motion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements AfterViewInit {
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private el     = inject(ElementRef);

  phone         = signal('');
  sending       = signal(false);
  error         = signal('');
  termsAccepted = signal(false);
  phoneFocused  = false;

  canSubmit = computed(
    () => this.phone().length === 10 && this.termsAccepted() && !this.sending()
  );

  ngAfterViewInit(): void {
    const host = this.el.nativeElement as HTMLElement;

    const card = host.querySelector<HTMLElement>('.login-card');
    if (card) {
      animate(
        card,
        { opacity: [0, 1], y: [36, 0], scale: [0.95, 1] },
        { type: 'spring', stiffness: 280, damping: 22 }
      );
    }

    const perks = Array.from(host.querySelectorAll<HTMLElement>('.perk'));
    if (perks.length) {
      animate(
        perks,
        { opacity: [0, 1], y: [8, 0] },
        { delay: stagger(0.06, { startDelay: 0.35 }), duration: 0.35 }
      );
    }

    const phoneWrap = host.querySelector<HTMLElement>('.phone-wrap');
    if (phoneWrap) {
      animate(phoneWrap, { opacity: [0, 1], x: [-12, 0] }, { delay: 0.3, duration: 0.4 });
    }

    const checkBlock = host.querySelector<HTMLElement>('.check-block');
    if (checkBlock) {
      animate(checkBlock, { opacity: [0, 1] }, { delay: 0.42, duration: 0.35 });
    }
  }

  toggleTerms(): void {
    this.termsAccepted.update(v => !v);
    if (this.termsAccepted()) {
      const btn = (this.el.nativeElement as HTMLElement).querySelector<HTMLElement>('.otp-btn');
      if (btn) {
        animate(btn, { scale: [1, 1.04, 1] }, { type: 'spring', stiffness: 400, damping: 15 });
      }
    }
  }

  sendOtp(): void {
    if (!this.canSubmit()) return;
    const num = this.phone().trim();
    this.error.set('');
    this.sending.set(true);

    this.auth.requestOtp(num).subscribe({
      next: () => {
        this.sending.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
        this.router.navigate(['/auth/verify'], {
          queryParams: { phone: num, ...(returnUrl ? { returnUrl } : {}) },
        });
      },
      error: () => {
        this.sending.set(false);
        this.error.set('Failed to send OTP. Please try again.');
      },
    });
  }

  onPhoneInput(val: string): void {
    this.phone.set(val.replace(/\D/g, '').slice(0, 10));
    this.error.set('');
  }

  onLogoError(img: HTMLImageElement): void {
    img.style.display = 'none';
  }
}
