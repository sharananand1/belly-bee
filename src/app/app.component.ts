import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CartService } from './core/services/cart.service';
import { ThemeService } from './core/services/theme.service';
import { ToastService, Toast } from './core/services/toast.service';
import { AuthService } from './core/services/auth.service';
import { AppConfigService } from './core/services/app-config.service';
import { KitchenService } from './core/services/kitchen.service';
import { RatingService } from './core/services/rating.service';
import { RatingPopupComponent } from './shared/components/rating-popup/rating-popup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, RatingPopupComponent],
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
  ratingSvc  = inject(RatingService);
  private router = inject(Router);

  readonly year = new Date().getFullYear();
  isAuthPage    = signal(false);
  currentUrl    = signal('');

  get cartCount(): number  { return this.cart.count; }

  get showCartFab(): boolean {
    if (this.cart.count === 0) return false;
    const url = this.currentUrl();
    return !url.startsWith('/cart') && !url.startsWith('/checkout') && !url.startsWith('/auth');
  }
  get isDark():    boolean { return this.theme.isDark; }
  get toastList(): Toast[] { return this.toasts.toasts(); }
  get isLoggedIn(): boolean { return this.auth.isLoggedIn(); }
  get partyWhatsApp(): string {
    const link = this.kitchen.status.whatsapp_link;
    return (link && !link.includes('9999999999')) ? link : 'https://wa.me/918899888683';
  }

  ngOnInit(): void {
    // Hide shell (nav/footer) on auth pages for full-screen login/verify experience
    this.isAuthPage.set(this.router.url.startsWith('/auth'));
    this.currentUrl.set(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects;
      this.isAuthPage.set(url.startsWith('/auth'));
      this.currentUrl.set(url);
      if (this.auth.isLoggedIn()) this.ratingSvc.checkForPendingRatings();
    });
    // Unregister stale service workers (clears cached old API URLs after redeploys)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.update());
      });
    }
    // Load config + kitchen status in parallel on every app start
    forkJoin([
      this.configSvc.load(),
      this.kitchen.load(),
    ]).subscribe();
  }

  toggleTheme(): void { this.theme.toggle(); }
  dismissToast(id: number): void { this.toasts.dismiss(id); }
  onRatingSubmitted(): void { this.ratingSvc.pendingOrderId.set(null); }
  onRatingDismissed(): void { /* markShown already called inside popup */ }

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
