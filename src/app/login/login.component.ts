// src/app/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthTokenService } from '../core/auth-token.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  phone = '';
  code = '';
  stage: 'enter-phone' | 'enter-code' = 'enter-phone';
  sending = false;
  verifying = false;
  error: string | null = null;

  constructor(private api: Api, private tokens: AuthTokenService, private router: Router) {}

  async sendOtp() {
    this.error = null;
    if (!/^\d{10}$/.test(this.phone)) { this.error = 'Enter 10-digit phone'; return; }
    this.sending = true;
    try {
      await firstValueFrom(this.api.requestOtp(this.phone));
      this.stage = 'enter-code';
    } catch (e: any) {
      this.error = e?.error?.message ?? 'Could not send OTP';
    } finally {
      this.sending = false;
    }
  }

  async verifyOtp() {
    this.error = null;
    if (!/^\d{6}$/.test(this.code)) { this.error = 'Enter 6-digit OTP'; return; }
    this.verifying = true;
    try {
      const res: any = await firstValueFrom(this.api.verifyOtp(this.phone, this.code));
      this.tokens.token = res.access; // interceptor will use this
      localStorage.setItem('bb_user', JSON.stringify(res.user));
      this.router.navigateByUrl('/main');
    } catch (e: any) {
      this.error = e?.error?.message ?? 'Invalid or expired OTP';
    } finally {
      this.verifying = false;
    }
  }
}
