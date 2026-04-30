import {
  Component, inject, signal, computed,
  AfterViewInit, OnDestroy, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { animate, stagger } from 'motion';

const OTP_RATE_KEY = 'bb_otp_rate';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private el     = inject(ElementRef);

  phone         = signal('');
  sending       = signal(false);
  error         = signal('');
  termsAccepted = signal(false);
  cooldownSecs  = signal(0);
  phoneFocused  = false;

  private _timer: ReturnType<typeof setInterval> | null = null;

  canSubmit = computed(
    () => this.phone().length === 10 && this.termsAccepted() && !this.sending() && this.cooldownSecs() === 0
  );

  get cooldownDisplay(): string {
    const s = this.cooldownSecs();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${s}s`;
  }

  constructor() {
    const stored = Number(localStorage.getItem(OTP_RATE_KEY) ?? '0');
    if (stored > Date.now()) {
      this.cooldownSecs.set(Math.ceil((stored - Date.now()) / 1000));
      this._startCooldownTimer(stored);
    }
  }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement as HTMLElement;

    const card = host.querySelector<HTMLElement>('.login-card');
    if (card) {
      animate(card, { opacity: [0, 1], y: [36, 0], scale: [0.95, 1] }, { type: 'spring', stiffness: 280, damping: 22 });
    }
    const perks = Array.from(host.querySelectorAll<HTMLElement>('.perk'));
    if (perks.length) {
      animate(perks, { opacity: [0, 1], y: [8, 0] }, { delay: stagger(0.06, { startDelay: 0.35 }), duration: 0.35 });
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

  ngOnDestroy(): void {
    if (this._timer) clearInterval(this._timer);
  }

  private _startCooldownTimer(until: number): void {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining <= 0) {
        this.cooldownSecs.set(0);
        clearInterval(this._timer!);
        this._timer = null;
        localStorage.removeItem(OTP_RATE_KEY);
      } else {
        this.cooldownSecs.set(remaining);
      }
    }, 1000);
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
      error: (err) => {
        this.sending.set(false);
        if (err?.status === 429) {
          const until = Date.now() + 10 * 60 * 1000;
          localStorage.setItem(OTP_RATE_KEY, String(until));
          this._startCooldownTimer(until);
        } else {
          this.error.set(
            err?.error?.data?.message ?? err?.error?.message ?? 'Failed to send OTP. Please try again.'
          );
        }
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
