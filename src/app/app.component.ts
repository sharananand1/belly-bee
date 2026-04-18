import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CartService } from './core/services/cart.service';
import { ThemeService } from './core/services/theme.service';
import { ToastService, Toast } from './core/services/toast.service';
import { AuthService } from './core/services/auth.service';
import { AppConfigService } from './core/services/app-config.service';
import { KitchenService } from './core/services/kitchen.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  cart       = inject(CartService);
  theme      = inject(ThemeService);
  toasts     = inject(ToastService);
  auth       = inject(AuthService);
  configSvc  = inject(AppConfigService);
  kitchen    = inject(KitchenService);

  readonly year = new Date().getFullYear();

  get cartCount(): number  { return this.cart.count; }
  get isDark():    boolean { return this.theme.isDark; }
  get toastList(): Toast[] { return this.toasts.toasts(); }
  get isLoggedIn(): boolean { return this.auth.isLoggedIn(); }

  ngOnInit(): void {
    // Load config + kitchen status in parallel on every app start
    forkJoin([
      this.configSvc.load(),
      this.kitchen.load(),
    ]).subscribe();
  }

  toggleTheme(): void { this.theme.toggle(); }
  dismissToast(id: number): void { this.toasts.dismiss(id); }

  toastIcon(type: Toast['type']): string {
    return { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' }[type];
  }

  onNotifyMe(): void {
    const user   = this.auth.getCachedUser();
    const mobile = user?.mobile ?? '';
    const userId = user?.id ?? null;
    if (!mobile) {
      // No cached user — show prompt or just try without mobile
      this.kitchen.notifyMe('', userId).subscribe(() => {
        this.toasts.success('We\'ll notify you when we open!');
      });
      return;
    }
    this.kitchen.notifyMe(mobile, userId).subscribe(() => {
      this.toasts.success('Got it! We\'ll notify you when we open.');
    });
  }
}
