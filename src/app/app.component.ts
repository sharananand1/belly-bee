import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from './core/services/cart.service';
import { ThemeService } from './core/services/theme.service';
import { ToastService, Toast } from './core/services/toast.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  cart    = inject(CartService);
  theme   = inject(ThemeService);
  toasts  = inject(ToastService);
  auth    = inject(AuthService);

  readonly year = new Date().getFullYear();

  get cartCount(): number { return this.cart.count; }
  get isDark():    boolean { return this.theme.isDark; }
  get toastList(): Toast[] { return this.toasts.toasts(); }
  get isLoggedIn(): boolean { return this.auth.isLoggedIn(); }

  toggleTheme(): void { this.theme.toggle(); }
  dismissToast(id: number): void { this.toasts.dismiss(id); }

  toastIcon(type: Toast['type']): string {
    return { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' }[type];
  }
}
