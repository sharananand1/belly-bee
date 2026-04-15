import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify.component.html',
  styleUrl:    './verify.component.css',
})
export class VerifyComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private auth      = inject(AuthService);
  private toast     = inject(ToastService);
  private router    = inject(Router);
  private route     = inject(ActivatedRoute);

  phone      = signal('');
  digits     = signal<string[]>(['', '', '', '', '', '']);
  verifying  = signal(false);
  resending  = signal(false);
  countdown  = signal(30);
  error      = signal('');

  private _timer: ReturnType<typeof setInterval> | null = null;

  get otp(): string { return this.digits().join(''); }
  get isComplete(): boolean { return this.otp.length === 6; }
  get maskedPhone(): string {
    const p = this.phone();
    return p ? '+91 ' + p.slice(0, 2) + '×'.repeat(6) + p.slice(-2) : '';
  }

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap.get('phone') ?? '';
    if (!p) { this.router.navigate(['/auth/login']); return; }
    this.phone.set(p);
    this._startCountdown();
  }

  ngAfterViewInit(): void {
    // Auto-focus first box
    setTimeout(() => this.digitInputs.first?.nativeElement.focus(), 100);
  }

  ngOnDestroy(): void {
    if (this._timer) clearInterval(this._timer);
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1); // keep last digit
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
    if (event.key === 'ArrowLeft' && index > 0) {
      this.digitInputs.toArray()[index - 1]?.nativeElement.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      this.digitInputs.toArray()[index + 1]?.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    this.digits.set(updated);
    const focusIdx = Math.min(pasted.length, 5);
    this.digitInputs.toArray()[focusIdx]?.nativeElement.focus();
    if (pasted.length === 6) this.verify();
  }

  verify(): void {
    if (!this.isComplete || this.verifying()) return;
    this.verifying.set(true);
    this.error.set('');

    this.auth.verifyOtp(this.phone(), this.otp).subscribe({
      next: () => {
        this.toast.success('Welcome to Belly Bee!');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/main';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.verifying.set(false);
        this.error.set(err?.error?.message ?? 'Invalid OTP. Please try again.');
        this.digits.set(['', '', '', '', '', '']);
        setTimeout(() => this.digitInputs.first?.nativeElement.focus(), 50);
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
        this.toast.success('OTP resent!');
        this._startCountdown();
        setTimeout(() => this.digitInputs.first?.nativeElement.focus(), 50);
      },
      error: () => {
        this.resending.set(false);
        this.toast.error('Failed to resend OTP.');
      },
    });
  }

  private _startCountdown(): void {
    this.countdown.set(30);
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      this.countdown.update(n => {
        if (n <= 1) { clearInterval(this._timer!); return 0; }
        return n - 1;
      });
    }, 1000);
  }
}
