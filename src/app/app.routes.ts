import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Root ────────────────────────────────────────────────────────────
  { path: '', redirectTo: 'main', pathMatch: 'full' },

  // ── Home ────────────────────────────────────────────────────────────
  {
    path: 'main',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Belly Bee — Cloud Kitchen, Chhatarpur, New Delhi',
  },

  // ── Menu ────────────────────────────────────────────────────────────
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent),
    title: 'Menu — Belly Bee',
  },
  {
    path: 'menu/:categoryId',
    loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent),
    title: 'Menu — Belly Bee',
  },

  // ── Item Detail ─────────────────────────────────────────────────────
  {
    path: 'item/:id',
    loadComponent: () => import('./pages/item-detail/item-detail.component').then(m => m.ItemDetailComponent),
    title: 'Item — Belly Bee',
  },

  // ── Cart ─────────────────────────────────────────────────────────────
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
    title: 'Cart — Belly Bee',
  },

  // ── Checkout ─────────────────────────────────────────────────────────
  {
    path: 'checkout',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'address', pathMatch: 'full' },
      {
        path: 'address',
        loadComponent: () =>
          import('./pages/checkout/address/checkout-address.component').then(m => m.CheckoutAddressComponent),
        title: 'Delivery Address — Belly Bee',
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('./pages/checkout/payment/checkout-payment.component').then(m => m.CheckoutPaymentComponent),
        title: 'Payment — Belly Bee',
      },
    ],
  },

  // ── Order ─────────────────────────────────────────────────────────────
  {
    path: 'order/:id',
    loadComponent: () =>
      import('./pages/order/confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent),
    title: 'Order Confirmed — Belly Bee',
  },

  // ── Auth ──────────────────────────────────────────────────────────────
  {
    path: 'auth',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Login — Belly Bee',
      },
      {
        path: 'verify',
        loadComponent: () => import('./pages/auth/verify/verify.component').then(m => m.VerifyComponent),
        title: 'Verify OTP — Belly Bee',
      },
    ],
  },

  // ── Profile (auth guarded) ────────────────────────────────────────────
  {
    path: 'profile',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/profile/home/profile-home.component').then(m => m.ProfileHomeComponent),
        title: 'My Profile — Belly Bee',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/profile/orders/order-history.component').then(m => m.OrderHistoryComponent),
        title: 'My Orders — Belly Bee',
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./pages/profile/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        title: 'Order Detail — Belly Bee',
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 — Belly Bee',
  },
];
