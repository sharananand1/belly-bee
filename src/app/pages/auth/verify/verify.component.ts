import {
  Component, inject, signal, OnInit, OnDestroy,
  ElementRef, ViewChildren, QueryList, AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

// Escalating resend cooldowns: 30s initial, then 60s → 120s → 600s per resend
const INITIAL_COOLDOWN   = 30;
const RESEND_COOLDOWNS   = [60, 120, 600]; // indexed by (resendCount - 1), clamped at last value
const MAX_ATTEMPTS       = 3;
const OTP_RESEND_KEY     = 'bb_otp_resend';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify.component.html',
  styleUrl:    './verify.component.css',
})
export class VerifyComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private auth    = inject(AuthService);
  private toast   = inject(ToastService);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);

  phone        = signal('');
  digits       = signal<string[]>(['', '', '', '', '', '']);
  verifying    = signal(false);
  resending    = signal(false);
  countdown    = signal(INITIAL_COOLDOWN);
  error        = signal('');
  attemptsLeft = signal(MAX_ATTEMPTS);
  otpExpired   = signal(false);
  resendCount  = signal(0);

  private _timer: ReturnType<typeof setInterval> | null = null;

  get otp(): string { return this.digits().join(''); }
  get isComplete(): boolean { return this.otp.length === 6; }
  get canVerify(): boolean { return this.isComplete && !this.verifying() && !this.otpExpired(); }

  get maskedPhone(): string {
    const p = this.phone();
    return p ? '+91 ' + p.slice(0, 2) + '×'.repeat(6) + p.slice(-2) : '';
  }

  get cooldownDisplay(): string {
    const s = this.countdown();
    if (s <= 0) return '';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${s}s`;
  }

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap.get('phone') ?? '';
    if (!p) { this.router.navigate(['/auth/login']); return; }
    this.phone.set(p);

    // Restore active resend cooldown (page refresh within cooldown window)
    const stored = localStorage.getItem(OTP_RESEND_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.phone === p && data.until > Date.now()) {
          this.resendCount.set(data.count ?? 0);
          this._startCountdown(data.until);
          return;
        }
      } catch {}
      localStorage.removeItem(OTP_RESEND_KEY);
    }

    // Fresh OTP just sent — always start with initial 30s cooldown
    this._startCountdown(Date.now() + INITIAL_COOLDOWN * 1000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.digitInputs.first?.nativeElement.focus(), 120);
  }

  ngOnDestroy(): void {
    if (this._timer) clearInterval(this._timer);
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    input.value = val;

    const updated = [...this.digits()];
    updated[index] = val;
    this.digits.set(updated);
    this.error.set('');

    if (val && index < 5) {
      this.digitInputs.toArray()[index + 1]?.nativeElement.focus();
    }
    if (this.isComplete) this.verify();
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const updated = [...this.digits()];
      if (updated[index]) {
        updated[index] = '';
        this.digits.set(updated);
      } else if (index > 0) {
        this.digitInputs.toArray()[index - 1]?.nativeElement.focus();
      }
    }
    if (event.key === 'ArrowLeft'  && index > 0) this.digitInputs.toArray()[index - 1]?.nativeElement.focus();
    if (event.key === 'ArrowRight' && index < 5) this.digitInputs.toArray()[index + 1]?.nativeElement.focus();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    this.digits.set(updated);
    this.digitInputs.toArray()[Math.min(pasted.length, 5)]?.nativeElement.focus();
    if (pasted.length === 6) this.verify();
  }

  verify(): void {
    if (!this.canVerify) return;
    this.verifying.set(true);
    this.error.set('');

    this.auth.verifyOtp(this.phone(), this.otp).subscribe({
      next: () => {
        localStorage.removeItem(OTP_RESEND_KEY);
        this.toast.success('Welcome to Belly Bee! 🐝');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/main';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.verifying.set(false);
        const msg: string = err?.error?.data?.message ?? err?.error?.message ?? '';
        const isExpired = /expired|maximum|too many/i.test(msg);

        if (isExpired) {
          this.otpExpired.set(true);
          this.error.set('');
        } else {
          // Decrement local attempt counter (backend message is authoritative)
          const remaining = this.attemptsLeft() - 1;
          this.attemptsLeft.set(Math.max(0, remaining));
          if (remaining <= 0) {
            this.otpExpired.set(true);
          } else {
            this.error.set(msg || `Incorrect OTP — ${remaining} attempt${remaining === 1 ? '' : 's'} left.`);
            this.digits.set(['', '', '', '', '', '']);
            setTimeout(() => this.digitInputs.first?.nativeElement.focus(), 50);
          }
        }
      },
    });
  }

  resendOtp(): void {
    if (this.countdown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.digits.set(['', '', '', '', '', '']);
    this.error.set('');

    this.auth.requestOtp(this.phone()).subscribe({
      next: () => {
        this.resending.set(false);
        this.otpExpired.set(false);
        this.attemptsLeft.set(MAX_ATTEMPTS);
        this.toast.success('New OTP sent!');

        const newCount = this.resendCount() + 1;
        this.resendCount.set(newCount);

        // Escalating cooldown: 60s → 120s → 600s
        const secs  = RESEND_COOLDOWNS[Math.min(newCount - 1, RESEND_COOLDOWNS.length - 1)];
        const until = Date.now() + secs * 1000;
        localStorage.setItem(OTP_RESEND_KEY, JSON.stringify({ until, count: newCount, phone: this.phone() }));

        this._startCountdown(until);
        setTimeout(() => this.digitInputs.first?.nativeElement.focus(), 80);
      },
      error: (err) => {
        this.resending.set(false);
        if (err?.status === 429) {
          const until = Date.now() + 10 * 60 * 1000;
          localStorage.setItem(OTP_RESEND_KEY, JSON.stringify({ until, count: this.resendCount(), phone: this.phone() }));
          this._startCountdown(until);
          this.toast.error('Too many requests. Wait 10 minutes.');
        } else {
          this.toast.error('Could not resend OTP. Please try again.');
        }
      },
    });
  }

  private _startCountdown(until: number): void {
    if (this._timer) clearInterval(this._timer);
    this.countdown.set(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    this._timer = setInterval(() => {
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining <= 0) {
        this.countdown.set(0);
        clearInterval(this._timer!);
        this._timer = null;
      } else {
        this.countdown.set(remaining);
      }
    }, 1000);
  }
}
