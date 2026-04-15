import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl:    './login.component.css',
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  phone    = signal('');
  sending  = signal(false);
  error    = signal('');

  sendOtp(): void {
    const num = this.phone().trim().replace(/\D/g, '');
    if (num.length !== 10) {
      this.error.set('Enter a valid 10-digit mobile number.');
      return;
    }
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
    // Allow only digits, max 10
    this.phone.set(val.replace(/\D/g, '').slice(0, 10));
    this.error.set('');
  }
}
