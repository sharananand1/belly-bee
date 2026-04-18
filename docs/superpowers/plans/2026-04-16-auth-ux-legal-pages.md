# Auth UX, Legal Pages & Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guest-to-login redirect at checkout, redesign the login page with glassmorphism + motion, create full Terms & Conditions and Privacy Policy pages, and wire footer legal links.

**Architecture:** All features are standalone Angular 18 components using signals for local state. `motion` (vanilla JS API) drives animations in `ngAfterViewInit` via `ElementRef`. Cart persists through login automatically via `localStorage`. Legal pages use a shared two-column layout with sticky ToC and `inView()` scroll animations.

**Tech Stack:** Angular 18.2, `motion` npm package (vanilla animate/inView/stagger/spring API), CSS custom properties from existing design system.

**Spec:** `docs/superpowers/specs/2026-04-16-auth-ux-legal-pages-design.md`

---

## Task 1: Install motion package

**Files:**
- Modify: `package.json`

- [ ] Run install:

```bash
npm install motion --save --legacy-peer-deps
```

- [ ] Verify `motion` appears in `package.json` dependencies:

```bash
node -e "const p=require('./package.json'); console.log('motion:', p.dependencies['motion'])"
```

Expected output: `motion: ^11.x.x` (or similar)

- [ ] Commit:

```bash
git add package.json package-lock.json
git commit -m "feat: install motion for animation"
```

---

## Task 2: Checkout auth guard — block guests at checkout

**Files:**
- Modify: `src/app/app.routes.ts` (add `canActivate: [authGuard]` to checkout parent)
- Modify: `src/app/pages/cart/cart.component.ts` (inject `AuthService`, update `checkout()`)

- [ ] Open `src/app/app.routes.ts`. Find the checkout block (currently has the comment "Guest checkout: no auth guard") and add `canActivate`:

```typescript
// ── Checkout ─────────────────────────────────────────────
{
  path: 'checkout',
  canActivate: [authGuard],          // ← ADD THIS LINE
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
```

- [ ] Open `src/app/pages/cart/cart.component.ts`. Add `AuthService` import and inject it. Replace the `checkout()` method:

```typescript
// Add to imports at top of file:
import { AuthService } from '../../core/services/auth.service';

// Add inside the class (after existing private injections):
private authSvc = inject(AuthService);

// Replace existing checkout() method:
checkout(): void {
  this.analytics.track('checkout_start', { subtotal: this.subtotal(), total: this.total() });
  if (this.authSvc.isLoggedIn()) {
    this.router.navigate(['/checkout/address']);
  } else {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: '/checkout/address' },
    });
  }
}
```

- [ ] Verify the app builds without errors:

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: `Application bundle generation complete.`

- [ ] Commit:

```bash
git add src/app/app.routes.ts src/app/pages/cart/cart.component.ts
git commit -m "feat: block guest checkout — redirect to login with returnUrl"
```

---

## Task 3: Login component TypeScript — redesign

**Files:**
- Modify: `src/app/pages/auth/login/login.component.ts`

- [ ] Replace the full content of `login.component.ts`:

```typescript
import {
  Component, inject, signal, computed,
  AfterViewInit, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { animate, stagger, spring } from 'motion';

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

    const card = host.querySelector('.login-card');
    if (card) {
      animate(
        card,
        { opacity: [0, 1], y: [36, 0], scale: [0.95, 1] },
        { easing: spring({ stiffness: 280, damping: 22 }) }
      );
    }

    const perks = host.querySelectorAll('.perk');
    if (perks.length) {
      animate(
        perks as unknown as Element[],
        { opacity: [0, 1], y: [8, 0] },
        { delay: stagger(0.06, { start: 0.35 }), duration: 0.35 }
      );
    }

    const phoneWrap = host.querySelector('.phone-wrap');
    if (phoneWrap) {
      animate(phoneWrap, { opacity: [0, 1], x: [-12, 0] }, { delay: 0.3, duration: 0.4 });
    }

    const checkBlock = host.querySelector('.check-block');
    if (checkBlock) {
      animate(checkBlock, { opacity: [0, 1] }, { delay: 0.42, duration: 0.35 });
    }
  }

  toggleTerms(): void {
    this.termsAccepted.update(v => !v);
    if (this.termsAccepted()) {
      const btn = (this.el.nativeElement as HTMLElement).querySelector('.otp-btn');
      if (btn) {
        animate(btn, { scale: [1, 1.04, 1] }, { easing: spring({ stiffness: 400, damping: 15 }) });
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
```

- [ ] Commit:

```bash
git add src/app/pages/auth/login/login.component.ts
git commit -m "feat: login component TS — termsAccepted signal, motion entrance, canSubmit guard"
```

---

## Task 4: Login component HTML — full redesign

**Files:**
- Modify: `src/app/pages/auth/login/login.component.html`

- [ ] Replace the full content of `login.component.html`:

```html
<div class="login-page">

  <!-- Background layers -->
  <div class="bg-grad"></div>
  <div class="bg-hex"></div>
  <div class="bg-glow bg-glow--a"></div>
  <div class="bg-glow bg-glow--b"></div>

  <!-- Floating food emojis -->
  <span class="float-emoji" style="top:7%;left:4%;animation-delay:0s" aria-hidden="true">🍛</span>
  <span class="float-emoji" style="top:14%;right:6%;animation-delay:1.3s" aria-hidden="true">🍯</span>
  <span class="float-emoji" style="bottom:22%;left:5%;animation-delay:2.2s" aria-hidden="true">🐝</span>
  <span class="float-emoji" style="bottom:10%;right:7%;animation-delay:.7s" aria-hidden="true">🌶️</span>
  <span class="float-emoji float-emoji--sm" style="top:50%;left:2%;animation-delay:1.8s" aria-hidden="true">✦</span>
  <span class="float-emoji float-emoji--sm" style="top:60%;right:3%;animation-delay:3s" aria-hidden="true">✦</span>

  <!-- Card -->
  <div class="login-card" role="main" aria-label="Sign in to Belly Bee">

    <!-- Header band with hex logo -->
    <div class="login-header">
      <div class="hex-logo">
        <div class="hex-bg"></div>
        <img
          class="hex-img"
          src="assets/bellyBeeLogo.webp"
          alt="Belly Bee"
          width="56"
          height="64"
          (error)="onLogoError($any($event.target))"
        />
      </div>
      <div class="brand-text">
        <div class="brand-name">Belly <span>Bee</span></div>
        <div class="brand-sub">Cloud Kitchen ✦ Fresh &amp; Fast</div>
        <div class="brand-loc">
          <span class="loc-dot"></span>
          Chhatarpur · New Delhi 110074
        </div>
      </div>
    </div>

    <!-- Form body -->
    <div class="login-body">

      <div class="login-heading">
        <h1>Welcome back! 👋</h1>
        <p>Enter your mobile — we'll send a quick OTP.</p>
      </div>

      <div class="perks" aria-label="Why Belly Bee">
        <span class="perk">🚀 30-min Delivery</span>
        <span class="perk">🌿 Fresh Daily</span>
        <span class="perk">💳 Easy Pay</span>
      </div>

      <!-- Phone input -->
      <div class="phone-wrap" [class.focused]="phoneFocused">
        <span class="phone-prefix">🇮🇳 +91</span>
        <input
          type="tel"
          class="phone-input"
          placeholder="98765 43210"
          [value]="phone()"
          (input)="onPhoneInput($any($event.target).value)"
          (focus)="phoneFocused = true"
          (blur)="phoneFocused = false"
          (keydown.enter)="sendOtp()"
          maxlength="10"
          inputmode="numeric"
          autocomplete="tel-national"
          aria-label="Mobile number"
        />
      </div>

      @if (error()) {
        <p class="login-error" role="alert">
          <span class="material-icons-round" aria-hidden="true">error_outline</span>
          {{ error() }}
        </p>
      }

      <!-- Single checkbox -->
      <div
        class="check-block"
        (click)="toggleTerms()"
        role="checkbox"
        [attr.aria-checked]="termsAccepted()"
        tabindex="0"
        (keydown.space)="$event.preventDefault(); toggleTerms()"
        (keydown.enter)="$event.preventDefault(); toggleTerms()">
        <span class="custom-check" [class.on]="termsAccepted()" aria-hidden="true"></span>
        <span class="check-text">
          I agree to Belly Bee's
          <a routerLink="/terms" (click)="$event.stopPropagation()">Terms &amp; Conditions</a>
          and
          <a routerLink="/privacy" (click)="$event.stopPropagation()">Privacy Policy</a>
          — including our data &amp; order policies.
        </span>
      </div>

      <!-- CTA -->
      <button
        type="button"
        class="otp-btn"
        (click)="sendOtp()"
        [disabled]="!canSubmit()"
        aria-label="Get OTP to sign in">
        @if (sending()) {
          <span class="material-icons-round login-spin" aria-hidden="true">sync</span>
          Sending OTP…
        } @else {
          <span>Get OTP</span>
          <span class="btn-arrow" aria-hidden="true">→</span>
        }
      </button>

      <div class="login-divider" aria-hidden="true">or continue without account</div>

      <a routerLink="/menu" class="guest-link">
        ← Browse Menu as Guest
      </a>

      <div class="trust-row" aria-label="Trust indicators">
        <span>🔒 Secure OTP</span>
        <span>⭐ 4.8 Rated</span>
        <span>🏠 Chhatarpur</span>
      </div>

    </div><!-- /login-body -->
  </div><!-- /login-card -->

</div>
```

- [ ] Commit:

```bash
git add src/app/pages/auth/login/login.component.html
git commit -m "feat: login page HTML — glassmorphism card, hex logo, single T&C checkbox"
```

---

## Task 5: Login component CSS — full redesign

**Files:**
- Modify: `src/app/pages/auth/login/login.component.css`

- [ ] Replace the full content of `login.component.css`:

```css
/* ── Page ── */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0C0501;
  padding: 1rem;
}

/* ── Background layers ── */
.bg-grad {
  position: fixed; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 90% 60% at 15% 5%, rgba(190,85,0,.50) 0%, transparent 55%),
    radial-gradient(ellipse 70% 70% at 85% 95%, rgba(110,45,0,.45) 0%, transparent 55%),
    radial-gradient(ellipse 100% 100% at 50% 50%, #1A0800 0%, #0C0501 100%);
}

.bg-hex {
  position: fixed; inset: 0; pointer-events: none; opacity: .055;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V17L28 1l28 16v33L28 66zm0-6l22-13V23L28 7 6 23v24l22 13z' fill='%23F5A623'/%3E%3Cpath d='M28 100L0 84V51l28 16 28-16v33L28 100zm0-6l22-13V67L28 51l-22 16v14l22 13z' fill='%23F5A623'/%3E%3C/svg%3E");
  background-size: 56px 100px;
}

.bg-glow {
  position: fixed; border-radius: 50%; pointer-events: none;
}
.bg-glow--a {
  width: 520px; height: 520px;
  background: radial-gradient(circle, rgba(245,166,35,.15) 0%, transparent 70%);
  top: -130px; left: -160px;
  animation: glowDriftA 9s ease-in-out infinite alternate;
}
.bg-glow--b {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(180,70,0,.18) 0%, transparent 70%);
  bottom: -90px; right: -110px;
  animation: glowDriftB 11s ease-in-out infinite alternate;
}
@keyframes glowDriftA { to { transform: translate(28px, 18px); } }
@keyframes glowDriftB { to { transform: translate(-22px, -14px); } }

/* Floating emojis */
.float-emoji {
  position: fixed; font-size: 2rem; opacity: .10;
  user-select: none; pointer-events: none;
  animation: floatEmoji 7s ease-in-out infinite alternate;
}
.float-emoji--sm { font-size: 1.2rem; }
@keyframes floatEmoji {
  0%   { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(-14px) rotate(8deg); }
}

/* ── Card ── */
.login-card {
  position: relative; z-index: 10;
  width: min(430px, 92vw);
  background: rgba(255,255,255,.065);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 40px 90px rgba(0,0,0,.5), 0 2px 0 rgba(255,255,255,.06) inset;
}
.login-card::before {
  content: '';
  position: absolute; top: 0; left: 8%; right: 8%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(245,166,35,.55), transparent);
}

/* ── Header band ── */
.login-header {
  background: linear-gradient(135deg, rgba(245,166,35,.18) 0%, rgba(180,70,0,.22) 100%);
  border-bottom: 1px solid rgba(245,166,35,.15);
  padding: 1.5rem 1.75rem 1.35rem;
  display: flex; align-items: center; gap: 1rem;
  position: relative; overflow: hidden;
}
.login-header::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent 5%, #F5A623 30%, #D4881A 50%, #F5A623 70%, transparent 95%);
  opacity: .8;
}

/* Hex logo */
.hex-logo {
  position: relative; flex-shrink: 0;
  width: 60px; height: 68px;
}
.hex-bg {
  position: absolute; inset: 0;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: linear-gradient(145deg, #F5A623 0%, #D4881A 60%, #B8730F 100%);
  box-shadow: 0 4px 20px rgba(245,166,35,.4);
}
.hex-img {
  position: absolute; inset: 3px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  object-fit: cover; display: block;
  width: calc(100% - 6px); height: calc(100% - 6px);
}

/* Brand text */
.brand-text { flex: 1; }
.brand-name {
  font-family: var(--font-heading);
  font-size: 1.5rem; font-weight: 800;
  color: #fff; line-height: 1; letter-spacing: -.01em;
  text-shadow: 0 2px 16px rgba(245,166,35,.25);
}
.brand-name span { color: var(--primary); }
.brand-sub {
  font-family: var(--font-accent, 'Caveat', cursive);
  font-size: .9rem; color: rgba(245,166,35,.65);
  margin-top: .3rem; letter-spacing: .02em;
}
.brand-loc {
  display: flex; align-items: center; gap: .3rem;
  margin-top: .4rem; font-size: .65rem; font-weight: 600;
  color: rgba(255,255,255,.32); letter-spacing: .06em; text-transform: uppercase;
}
.loc-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--primary); opacity: .6; flex-shrink: 0;
}

/* ── Body ── */
.login-body { padding: 1.65rem 1.75rem 1.5rem; }

.login-heading { margin-bottom: 1.25rem; }
.login-heading h1 {
  font-family: var(--font-heading);
  font-size: 1.35rem; font-weight: 800;
  color: #fff; line-height: 1.2; margin-bottom: .3rem;
}
.login-heading p { color: rgba(255,255,255,.48); font-size: .82rem; }

/* Perks */
.perks { display: flex; gap: .4rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.perk {
  display: flex; align-items: center; gap: .3rem;
  padding: .24rem .58rem; border-radius: 20px;
  border: 1px solid rgba(245,166,35,.2);
  background: rgba(245,166,35,.07);
  font-size: .67rem; font-weight: 600;
  color: rgba(245,166,35,.8);
}

/* Phone input */
.phone-wrap {
  display: flex; align-items: stretch;
  background: rgba(255,255,255,.08);
  border: 1.5px solid rgba(255,255,255,.16);
  border-radius: 14px; overflow: hidden;
  transition: border-color .2s, box-shadow .2s;
  margin-bottom: .85rem;
}
.phone-wrap.focused {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(245,166,35,.18);
}
.phone-prefix {
  padding: .85rem 1rem;
  background: rgba(245,166,35,.1);
  color: var(--primary); font-weight: 700; font-size: .9rem;
  border-right: 1px solid rgba(255,255,255,.1);
  display: flex; align-items: center; gap: .3rem; flex-shrink: 0;
}
.phone-input {
  flex: 1; padding: .85rem 1rem;
  background: transparent; border: none;
  color: #fff; font-size: 1rem; font-weight: 600;
  letter-spacing: .1em; outline: none;
  font-family: var(--font-body);
}
.phone-input::placeholder {
  color: rgba(255,255,255,.28); letter-spacing: 0; font-weight: 400;
}

/* Error */
.login-error {
  display: flex; align-items: center; gap: .35rem;
  color: #ff7b7b; font-size: .8rem; margin-bottom: .75rem;
}
.login-error .material-icons-round { font-size: 1rem; }

/* Checkbox */
.check-block {
  display: flex; align-items: flex-start; gap: .7rem;
  padding: .8rem .95rem;
  background: rgba(0,0,0,.18);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.07);
  margin-bottom: 1rem;
  cursor: pointer; user-select: none;
  transition: border-color .2s; outline: none;
}
.check-block:hover { border-color: rgba(245,166,35,.2); }
.check-block:focus-visible {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(245,166,35,.25);
}
.custom-check {
  width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px;
  border: 2px solid rgba(255,255,255,.22);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s; background: transparent;
}
.custom-check.on {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-color: var(--primary);
  box-shadow: 0 2px 10px rgba(245,166,35,.4);
}
.custom-check.on::after {
  content: '✓'; font-size: .75rem; font-weight: 900; color: #fff; line-height: 1;
}
.check-text { font-size: .78rem; color: rgba(255,255,255,.55); line-height: 1.55; }
.check-text a { color: var(--primary); font-weight: 600; text-decoration: none; }
.check-text a:hover { text-decoration: underline; }

/* OTP button */
.otp-btn {
  width: 100%; padding: .95rem 1.5rem;
  border: none; border-radius: 14px;
  background: linear-gradient(135deg, #F5A623 0%, #D4881A 55%, #C07010 100%);
  color: #fff; font-family: var(--font-body); font-size: 1rem; font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: .5rem;
  box-shadow: 0 6px 24px rgba(245,166,35,.45), 0 1px 0 rgba(255,255,255,.18) inset;
  transition: opacity .2s, transform .15s, box-shadow .2s;
  position: relative; overflow: hidden; letter-spacing: .01em;
  margin-bottom: .9rem;
}
.otp-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 32px rgba(245,166,35,.55);
}
.otp-btn:not(:disabled):active { transform: translateY(0); }
.otp-btn:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }
.otp-btn::after {
  content: ''; position: absolute;
  top: 0; left: -120%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
  animation: shimmerSweep 2.8s ease-in-out infinite;
}
@keyframes shimmerSweep { 0% { left: -120%; } 60%, 100% { left: 170%; } }
.btn-arrow { font-size: 1.1rem; transition: transform .2s; }
.otp-btn:not(:disabled):hover .btn-arrow { transform: translateX(4px); }
@keyframes spin { to { transform: rotate(360deg); } }
.login-spin { animation: spin .8s linear infinite; }

/* Divider */
.login-divider {
  display: flex; align-items: center; gap: .7rem;
  margin-bottom: .8rem;
  color: rgba(255,255,255,.18); font-size: .72rem;
}
.login-divider::before, .login-divider::after {
  content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.1);
}

/* Guest link */
.guest-link {
  display: flex; align-items: center; justify-content: center; gap: .4rem;
  color: rgba(255,255,255,.38); font-size: .78rem; font-weight: 500;
  text-decoration: none; transition: color .2s;
  margin-bottom: 1.1rem;
}
.guest-link:hover { color: rgba(255,255,255,.65); }

/* Trust row */
.trust-row {
  display: flex; justify-content: center; gap: 1.4rem;
  padding-top: .85rem; border-top: 1px solid rgba(255,255,255,.07);
  font-size: .67rem; color: rgba(255,255,255,.3);
}
.trust-row span { display: flex; align-items: center; gap: .3rem; }
```

- [ ] Verify dev build succeeds:

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: `Application bundle generation complete.`

- [ ] Commit:

```bash
git add src/app/pages/auth/login/login.component.css
git commit -m "feat: login page CSS — glassmorphism, hex logo, honeycomb bg, honey CTA"
```

---

## Task 6: Terms & Conditions page

**Files:**
- Create: `src/app/pages/legal/terms/terms.component.ts`
- Create: `src/app/pages/legal/terms/terms.component.html`
- Create: `src/app/pages/legal/terms/terms.component.css`
- Modify: `src/app/app.routes.ts`

- [ ] Create `src/app/pages/legal/terms/terms.component.ts`:

```typescript
import { Component, AfterViewInit, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { animate, inView } from 'motion';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css',
})
export class TermsComponent implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit(): void {
    const sections = (this.el.nativeElement as HTMLElement).querySelectorAll('.legal-section');
    sections.forEach((section) => {
      inView(section, () => {
        animate(section, { opacity: [0, 1], y: [16, 0] }, { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] });
      }, { margin: '0px 0px -60px 0px' });
    });
  }
}
```

- [ ] Create `src/app/pages/legal/terms/terms.component.html`:

```html
<div class="legal-page">

  <!-- Sticky page header -->
  <header class="legal-header">
    <div class="legal-header__inner">
      <a routerLink="/main" class="back-link">
        <span class="material-icons-round">arrow_back</span>
        Home
      </a>
      <div class="legal-header__brand">
        <div class="hex-logo-sm">
          <div class="hex-bg"></div>
          <img src="assets/bellyBeeLogo.webp" alt="" class="hex-img" aria-hidden="true" />
        </div>
        <div>
          <h1 class="legal-page-title">Terms &amp; Conditions</h1>
          <p class="legal-updated">Last updated: April 2026</p>
        </div>
      </div>
    </div>
  </header>

  <!-- Two-column layout -->
  <div class="legal-layout">

    <!-- Sticky ToC sidebar -->
    <aside class="legal-toc" aria-label="Table of contents">
      <h2 class="toc-title">Contents</h2>
      <nav>
        <a href="#acceptance"   class="toc-link">1. Acceptance</a>
        <a href="#services"     class="toc-link">2. Services &amp; Ordering</a>
        <a href="#delivery"     class="toc-link">3. Delivery &amp; Availability</a>
        <a href="#pricing"      class="toc-link">4. Pricing &amp; Payment</a>
        <a href="#cancellation" class="toc-link">5. Cancellation &amp; Refunds</a>
        <a href="#food"         class="toc-link">6. Food &amp; Allergens</a>
        <a href="#accounts"     class="toc-link">7. User Accounts</a>
        <a href="#ip"           class="toc-link">8. Intellectual Property</a>
        <a href="#liability"    class="toc-link">9. Limitation of Liability</a>
        <a href="#law"          class="toc-link">10. Governing Law</a>
        <a href="#contact-t"    class="toc-link">11. Contact Us</a>
      </nav>
    </aside>

    <!-- Content -->
    <main class="legal-content">

      <p class="legal-intro">
        Welcome to Belly Bee. By using our website or app to browse or place an order, you agree to these Terms &amp; Conditions. Please read them carefully.
      </p>

      <section class="legal-section" id="acceptance">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing our service, creating an account, or placing an order, you confirm that you have read, understood, and agree to be bound by these Terms &amp; Conditions. You must be at least 18 years of age, or acting with the consent of a parent or guardian. If you do not agree to these terms, please do not use our service.</p>
      </section>

      <section class="legal-section" id="services">
        <h2>2. Services &amp; Ordering</h2>
        <p>Belly Bee operates a cloud kitchen from Chhatarpur, New Delhi, preparing and delivering food orders placed through our website and app. By placing an order you enter into a binding agreement to purchase the selected items at the displayed price.</p>
        <p>We reserve the right to refuse or cancel any order at our discretion, including cases of suspected fraud, incorrect pricing, or item unavailability. If we cancel an order after payment has been received, you will receive a full refund. Menu items and availability are subject to change without notice; images are for illustrative purposes only.</p>
      </section>

      <section class="legal-section" id="delivery">
        <h2>3. Delivery Area &amp; Availability</h2>
        <p>We currently serve Chhatarpur, Mehrauli, Saket, and nearby areas of South Delhi. Delivery availability depends on your location, the time of your order, and kitchen capacity. We operate during our published hours; orders outside these hours may be accepted for the next available slot.</p>
        <p>Estimated delivery times are indicative only and may vary due to traffic, weather, or demand. Belly Bee is not liable for delays beyond our reasonable control.</p>
      </section>

      <section class="legal-section" id="pricing">
        <h2>4. Pricing &amp; Payment</h2>
        <p>All prices are in Indian Rupees (INR) and inclusive of applicable GST. Delivery charges may apply depending on your order value. Prices are subject to change without prior notice; the price shown at checkout is the final price.</p>
        <p>We accept UPI, credit/debit cards, net banking, and Cash on Delivery (COD). Online payments are processed securely by Razorpay — Belly Bee does not store card or UPI credentials.</p>
      </section>

      <section class="legal-section" id="cancellation">
        <h2>5. Cancellation &amp; Refunds</h2>
        <p>Orders may be cancelled within 2 minutes of placement for a full refund. After this window, cancellations are at our discretion, particularly once kitchen preparation has begun.</p>
        <p>Refunds for cancelled or incorrect orders are processed within 5–7 business days to your original payment method; timing depends on your bank. COD orders are not eligible for refunds once delivered.</p>
        <p>If you receive an incorrect or damaged order, please contact us within 2 hours of delivery with a photograph and order number for a resolution.</p>
      </section>

      <section class="legal-section" id="food">
        <h2>6. Food &amp; Allergens</h2>
        <p>We prepare food in a shared kitchen environment. While we take reasonable precautions, we cannot guarantee that any item is completely free from allergens including gluten, dairy, nuts, or eggs. Customers with severe allergies or specific dietary requirements should contact us directly before ordering.</p>
        <p>Nutritional information and detailed ingredient lists are available on request. Belly Bee is not liable for allergic reactions arising from undisclosed or unknown sensitivities.</p>
      </section>

      <section class="legal-section" id="accounts">
        <h2>7. User Accounts</h2>
        <p>Accounts are created using your mobile number and OTP verification. You are responsible for maintaining the security of your account and for all activity that occurs under it. Never share your OTP — Belly Bee will never ask for it.</p>
        <p>We reserve the right to suspend or terminate accounts that engage in fraudulent activity, abuse of our platform, or violation of these terms.</p>
      </section>

      <section class="legal-section" id="ip">
        <h2>8. Intellectual Property</h2>
        <p>All content on the Belly Bee platform — including the logo, brand name, photography, menu descriptions, and application code — is the intellectual property of Belly Bee and protected under applicable copyright and trademark laws. Unauthorised reproduction, distribution, or commercial use is strictly prohibited.</p>
      </section>

      <section class="legal-section" id="liability">
        <h2>9. Limitation of Liability</h2>
        <p>Belly Bee's liability for any claim arising from your use of our service is limited to the value of the specific order in dispute. We are not liable for any indirect, incidental, special, or consequential damages, including loss of profits or data.</p>
        <p>Our service is provided "as is" without warranties of any kind, express or implied, to the fullest extent permitted by applicable law.</p>
      </section>

      <section class="legal-section" id="law">
        <h2>10. Governing Law</h2>
        <p>These Terms &amp; Conditions are governed by the laws of India. Any disputes arising from your use of our service shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India. We encourage resolution of disputes through direct communication before legal proceedings.</p>
      </section>

      <section class="legal-section" id="contact-t">
        <h2>11. Contact Us</h2>
        <div class="contact-card">
          <p><strong>Belly Bee Cloud Kitchen</strong></p>
          <p>📍 Chhatarpur, New Delhi – 110074</p>
          <p>📧 support&#64;bellybee.in</p>
          <p>🕐 Available during business hours</p>
        </div>
        <p style="margin-top:1rem">
          Also see our <a routerLink="/privacy">Privacy Policy</a>.
        </p>
      </section>

    </main>
  </div>
</div>
```

- [ ] Create `src/app/pages/legal/terms/terms.component.css`:

```css
.legal-page {
  background: var(--bg);
  min-height: 100vh;
}

/* ── Header ── */
.legal-header {
  position: sticky; top: var(--header-h, 68px); z-index: 50;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}
.legal-header__inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: .85rem var(--space-md);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.back-link {
  display: flex; align-items: center; gap: .3rem;
  font-size: .82rem; font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color .15s;
  white-space: nowrap;
}
.back-link:hover { color: var(--primary); }
.back-link .material-icons-round { font-size: 1rem; }

.legal-header__brand {
  display: flex; align-items: center; gap: .75rem; flex: 1;
}

/* Small hex logo */
.hex-logo-sm {
  position: relative; flex-shrink: 0;
  width: 36px; height: 40px;
}
.hex-logo-sm .hex-bg {
  position: absolute; inset: 0;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: linear-gradient(145deg, #F5A623 0%, #D4881A 100%);
}
.hex-logo-sm .hex-img {
  position: absolute; inset: 2px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  object-fit: cover; display: block;
  width: calc(100% - 4px); height: calc(100% - 4px);
}

.legal-page-title {
  font-family: var(--font-heading);
  font-size: 1.1rem; font-weight: 800;
  color: var(--text-primary); margin: 0;
}
.legal-updated {
  font-size: .72rem; color: var(--text-secondary); margin: 0;
}

/* ── Two-column layout ── */
.legal-layout {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2rem var(--space-md);
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2.5rem;
  align-items: start;
}
@media (max-width: 767px) {
  .legal-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.25rem var(--space-md);
  }
}

/* ── ToC sidebar ── */
.legal-toc {
  position: sticky;
  top: calc(var(--header-h, 68px) + 64px);
}
.toc-title {
  font-family: var(--font-heading);
  font-size: .8rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--text-secondary);
  margin-bottom: .75rem;
}
.legal-toc nav {
  display: flex; flex-direction: column; gap: .15rem;
}
.toc-link {
  display: block;
  padding: .3rem .6rem;
  font-size: .78rem; font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 6px;
  border-left: 2px solid transparent;
  transition: all .15s;
  line-height: 1.4;
}
.toc-link:hover {
  color: var(--primary);
  border-left-color: var(--primary);
  background: rgba(245,166,35,.06);
}

/* Mobile ToC: horizontal scroll strip */
@media (max-width: 767px) {
  .legal-toc {
    position: static;
    overflow-x: auto;
    padding-bottom: .5rem;
  }
  .legal-toc nav {
    flex-direction: row;
    gap: .4rem;
    width: max-content;
  }
  .toc-link {
    border-left: none;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    padding: .35rem .7rem;
    background: var(--surface);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }
  .toc-link:hover { border-color: var(--primary); border-bottom-color: var(--primary); }
}

/* ── Content ── */
.legal-intro {
  font-size: .95rem;
  color: var(--text-secondary);
  background: rgba(245,166,35,.06);
  border-left: 3px solid var(--primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: .9rem 1rem;
  margin-bottom: 1.75rem;
  line-height: 1.7;
}

.legal-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  scroll-margin-top: calc(var(--header-h, 68px) + 80px);
  opacity: 0; /* initial state for inView animation */
}

.legal-section h2 {
  font-family: var(--font-heading);
  font-size: 1.1rem; font-weight: 700;
  color: var(--text-primary);
  margin-bottom: .85rem;
  padding-bottom: .6rem;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: .4rem;
}
.legal-section h2::before {
  content: '';
  display: inline-block;
  width: 4px; height: 18px;
  background: linear-gradient(to bottom, var(--primary), var(--primary-dark));
  border-radius: 2px;
  flex-shrink: 0;
}

.legal-section p {
  font-size: .9rem;
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: .75rem;
}
.legal-section p:last-child { margin-bottom: 0; }
.legal-section a { color: var(--primary); font-weight: 600; text-decoration: none; }
.legal-section a:hover { text-decoration: underline; }

/* Contact card */
.contact-card {
  background: rgba(245,166,35,.05);
  border: 1px solid rgba(245,166,35,.2);
  border-radius: var(--radius-sm);
  padding: 1rem 1.1rem;
  display: flex; flex-direction: column; gap: .4rem;
}
.contact-card p {
  font-size: .88rem;
  color: var(--text-secondary);
  margin: 0;
}
.contact-card strong { color: var(--text-primary); }
```

- [ ] Add `/terms` route to `src/app/app.routes.ts` (before the `**` wildcard route):

```typescript
{
  path: 'terms',
  loadComponent: () =>
    import('./pages/legal/terms/terms.component').then(m => m.TermsComponent),
  title: 'Terms & Conditions — Belly Bee',
},
```

- [ ] Verify build:

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: `Application bundle generation complete.`

- [ ] Commit:

```bash
git add src/app/pages/legal/terms/ src/app/app.routes.ts
git commit -m "feat: Terms & Conditions page with two-column layout, sticky ToC, scroll animations"
```

---

## Task 7: Privacy Policy page

**Files:**
- Create: `src/app/pages/legal/privacy/privacy.component.ts`
- Create: `src/app/pages/legal/privacy/privacy.component.html`
- Create: `src/app/pages/legal/privacy/privacy.component.css`
- Modify: `src/app/app.routes.ts`

- [ ] Create `src/app/pages/legal/privacy/privacy.component.ts`:

```typescript
import { Component, AfterViewInit, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { animate, inView } from 'motion';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css',
})
export class PrivacyComponent implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit(): void {
    const sections = (this.el.nativeElement as HTMLElement).querySelectorAll('.legal-section');
    sections.forEach((section) => {
      inView(section, () => {
        animate(section, { opacity: [0, 1], y: [16, 0] }, { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] });
      }, { margin: '0px 0px -60px 0px' });
    });
  }
}
```

- [ ] Create `src/app/pages/legal/privacy/privacy.component.html`:

```html
<div class="legal-page">

  <header class="legal-header">
    <div class="legal-header__inner">
      <a routerLink="/main" class="back-link">
        <span class="material-icons-round">arrow_back</span>
        Home
      </a>
      <div class="legal-header__brand">
        <div class="hex-logo-sm">
          <div class="hex-bg"></div>
          <img src="assets/bellyBeeLogo.webp" alt="" class="hex-img" aria-hidden="true" />
        </div>
        <div>
          <h1 class="legal-page-title">Privacy Policy</h1>
          <p class="legal-updated">Last updated: April 2026</p>
        </div>
      </div>
    </div>
  </header>

  <div class="legal-layout">

    <aside class="legal-toc" aria-label="Table of contents">
      <h2 class="toc-title">Contents</h2>
      <nav>
        <a href="#intro"       class="toc-link">1. Introduction</a>
        <a href="#collect"     class="toc-link">2. Data We Collect</a>
        <a href="#use"         class="toc-link">3. How We Use It</a>
        <a href="#sharing"     class="toc-link">4. Sharing with Third Parties</a>
        <a href="#cookies"     class="toc-link">5. Cookies &amp; Storage</a>
        <a href="#retention"   class="toc-link">6. Data Retention</a>
        <a href="#rights"      class="toc-link">7. Your Rights</a>
        <a href="#security"    class="toc-link">8. Data Security</a>
        <a href="#children"    class="toc-link">9. Children's Privacy</a>
        <a href="#changes"     class="toc-link">10. Policy Changes</a>
        <a href="#contact-p"   class="toc-link">11. Contact Us</a>
      </nav>
    </aside>

    <main class="legal-content">

      <p class="legal-intro">
        Belly Bee ("we", "us", "our") is committed to protecting your privacy. This policy explains what personal data we collect, how we use it, who we share it with, and the rights you have over it.
      </p>

      <section class="legal-section" id="intro">
        <h2>1. Introduction</h2>
        <p>This Privacy Policy applies to all users of the Belly Bee website and app. By using our service you consent to the collection and use of your information as described here. This policy is governed by the Information Technology Act, 2000 and applicable Indian data protection regulations.</p>
      </section>

      <section class="legal-section" id="collect">
        <h2>2. Data We Collect</h2>
        <p><strong>Account data:</strong> Your mobile number (required for OTP login), name, and email address (optional, for order updates).</p>
        <p><strong>Order data:</strong> Items ordered, delivery address, special instructions, and payment method type (e.g., UPI, card) — but never card numbers or CVV.</p>
        <p><strong>Location data:</strong> The delivery address you enter manually, or approximate location if you use "Detect my location" (requires explicit browser permission).</p>
        <p><strong>Device &amp; usage data:</strong> IP address, browser type, device identifiers, pages visited, and items browsed — used for fraud prevention and improving recommendations.</p>
      </section>

      <section class="legal-section" id="use">
        <h2>3. How We Use Your Data</h2>
        <p>We use your data to: process and deliver your orders; send OTP verification and order status notifications via SMS; improve our menu, pricing, and service quality; detect and prevent fraudulent activity; and comply with our legal and regulatory obligations.</p>
        <p>We do not use your data for automated decision-making or profiling that produces legal or significant effects on you.</p>
      </section>

      <section class="legal-section" id="sharing">
        <h2>4. Sharing with Third Parties</h2>
        <p>We share your data only where necessary:</p>
        <p><strong>Delivery partners:</strong> Your name, phone number, and delivery address are shared with our delivery personnel to fulfil your order.</p>
        <p><strong>Payment gateway (Razorpay):</strong> Transaction data is processed by Razorpay under their own privacy policy. We do not receive or store your card or UPI credentials.</p>
        <p><strong>Analytics:</strong> Aggregated, anonymised usage data may be shared with analytics tools to help us understand service performance.</p>
        <p>We do not sell, rent, or trade your personal data to any third party for marketing purposes.</p>
      </section>

      <section class="legal-section" id="cookies">
        <h2>5. Cookies &amp; Local Storage</h2>
        <p>We use <strong>localStorage</strong> in your browser to store your cart contents (key: <code>bb_cart</code>), authentication token (key: <code>bb_token</code>), and theme preference (key: <code>bb_theme</code>). These are stored locally on your device and are not transmitted to our servers.</p>
        <p>We may use minimal analytics cookies to understand how users interact with our service. You can clear localStorage and cookies at any time via your browser settings; doing so will log you out and clear your cart.</p>
      </section>

      <section class="legal-section" id="retention">
        <h2>6. Data Retention</h2>
        <p>Order and account data is retained for up to 3 years to meet our legal and tax compliance obligations under Indian law. After this period, personal identifiers are anonymised or deleted.</p>
        <p>You may request earlier deletion of non-mandatory personal data (such as your name or email) by contacting us. We will process such requests within 30 days.</p>
      </section>

      <section class="legal-section" id="rights">
        <h2>7. Your Rights</h2>
        <p>You have the right to: access a copy of the personal data we hold about you; correct inaccurate data; request deletion of your data (subject to legal retention obligations); and withdraw consent for optional data uses at any time.</p>
        <p>To exercise any of these rights, contact us at privacy&#64;bellybee.in. We will acknowledge your request within 7 days and respond fully within 30 days.</p>
      </section>

      <section class="legal-section" id="security">
        <h2>8. Data Security</h2>
        <p>All data transmitted between your device and our servers is encrypted using HTTPS/TLS. We use OTP-based authentication, meaning no passwords are ever stored. Our systems follow industry-standard security practices including access controls and regular security reviews.</p>
        <p>In the event of a data breach that affects your rights, we will notify you and relevant authorities as required by applicable law.</p>
      </section>

      <section class="legal-section" id="children">
        <h2>9. Children's Privacy</h2>
        <p>Our service is not directed to children under the age of 13. We do not knowingly collect personal data from minors. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>
      </section>

      <section class="legal-section" id="changes">
        <h2>10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will post the updated policy on this page with a revised date. Continued use of our service after any changes constitutes your acceptance of the updated policy.</p>
      </section>

      <section class="legal-section" id="contact-p">
        <h2>11. Contact Us</h2>
        <div class="contact-card">
          <p><strong>Belly Bee Cloud Kitchen — Privacy Team</strong></p>
          <p>📍 Chhatarpur, New Delhi – 110074</p>
          <p>📧 privacy&#64;bellybee.in</p>
          <p>🕐 Responses within 30 days</p>
        </div>
        <p style="margin-top:1rem">
          Also see our <a routerLink="/terms">Terms &amp; Conditions</a>.
        </p>
      </section>

    </main>
  </div>
</div>
```

- [ ] Create `src/app/pages/legal/privacy/privacy.component.css` — identical layout to terms, import by extending the same structure:

```css
/* Privacy policy uses the same layout as Terms — all rules duplicated here
   so each component is self-contained (no shared stylesheet coupling). */

.legal-page { background: var(--bg); min-height: 100vh; }

.legal-header {
  position: sticky; top: var(--header-h, 68px); z-index: 50;
  background: var(--surface); border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}
.legal-header__inner {
  max-width: var(--max-width); margin: 0 auto;
  padding: .85rem var(--space-md);
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
}
.back-link {
  display: flex; align-items: center; gap: .3rem;
  font-size: .82rem; font-weight: 600; color: var(--text-secondary);
  text-decoration: none; transition: color .15s; white-space: nowrap;
}
.back-link:hover { color: var(--primary); }
.back-link .material-icons-round { font-size: 1rem; }
.legal-header__brand { display: flex; align-items: center; gap: .75rem; flex: 1; }

.hex-logo-sm { position: relative; flex-shrink: 0; width: 36px; height: 40px; }
.hex-logo-sm .hex-bg {
  position: absolute; inset: 0;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: linear-gradient(145deg, #F5A623 0%, #D4881A 100%);
}
.hex-logo-sm .hex-img {
  position: absolute; inset: 2px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  object-fit: cover; display: block;
  width: calc(100% - 4px); height: calc(100% - 4px);
}
.legal-page-title {
  font-family: var(--font-heading); font-size: 1.1rem; font-weight: 800;
  color: var(--text-primary); margin: 0;
}
.legal-updated { font-size: .72rem; color: var(--text-secondary); margin: 0; }

.legal-layout {
  max-width: var(--max-width); margin: 0 auto;
  padding: 2rem var(--space-md);
  display: grid; grid-template-columns: 200px 1fr;
  gap: 2.5rem; align-items: start;
}
@media (max-width: 767px) {
  .legal-layout { grid-template-columns: 1fr; gap: 1.5rem; padding: 1.25rem var(--space-md); }
}

.legal-toc { position: sticky; top: calc(var(--header-h, 68px) + 64px); }
.toc-title {
  font-family: var(--font-heading); font-size: .8rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--text-secondary); margin-bottom: .75rem;
}
.legal-toc nav { display: flex; flex-direction: column; gap: .15rem; }
.toc-link {
  display: block; padding: .3rem .6rem; font-size: .78rem; font-weight: 500;
  color: var(--text-secondary); text-decoration: none;
  border-radius: 6px; border-left: 2px solid transparent; transition: all .15s; line-height: 1.4;
}
.toc-link:hover { color: var(--primary); border-left-color: var(--primary); background: rgba(245,166,35,.06); }

@media (max-width: 767px) {
  .legal-toc { position: static; overflow-x: auto; padding-bottom: .5rem; }
  .legal-toc nav { flex-direction: row; gap: .4rem; width: max-content; }
  .toc-link {
    border-left: none; border-bottom: 2px solid transparent; white-space: nowrap;
    padding: .35rem .7rem; background: var(--surface);
    border-radius: var(--radius-sm); border: 1px solid var(--border);
  }
  .toc-link:hover { border-color: var(--primary); }
}

.legal-intro {
  font-size: .95rem; color: var(--text-secondary);
  background: rgba(245,166,35,.06); border-left: 3px solid var(--primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: .9rem 1rem; margin-bottom: 1.75rem; line-height: 1.7;
}

.legal-section {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 1.25rem;
  scroll-margin-top: calc(var(--header-h, 68px) + 80px);
  opacity: 0;
}
.legal-section h2 {
  font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700;
  color: var(--text-primary); margin-bottom: .85rem; padding-bottom: .6rem;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: .4rem;
}
.legal-section h2::before {
  content: ''; display: inline-block; width: 4px; height: 18px;
  background: linear-gradient(to bottom, var(--primary), var(--primary-dark));
  border-radius: 2px; flex-shrink: 0;
}
.legal-section p { font-size: .9rem; color: var(--text-secondary); line-height: 1.75; margin-bottom: .75rem; }
.legal-section p:last-child { margin-bottom: 0; }
.legal-section strong { color: var(--text-primary); }
.legal-section code { font-family: monospace; font-size: .82rem; background: var(--border); padding: .1rem .35rem; border-radius: 4px; }
.legal-section a { color: var(--primary); font-weight: 600; text-decoration: none; }
.legal-section a:hover { text-decoration: underline; }

.contact-card {
  background: rgba(245,166,35,.05); border: 1px solid rgba(245,166,35,.2);
  border-radius: var(--radius-sm); padding: 1rem 1.1rem;
  display: flex; flex-direction: column; gap: .4rem;
}
.contact-card p { font-size: .88rem; color: var(--text-secondary); margin: 0; }
.contact-card strong { color: var(--text-primary); }
```

- [ ] Add `/privacy` route to `src/app/app.routes.ts` (right after the `/terms` route, before `**`):

```typescript
{
  path: 'privacy',
  loadComponent: () =>
    import('./pages/legal/privacy/privacy.component').then(m => m.PrivacyComponent),
  title: 'Privacy Policy — Belly Bee',
},
```

- [ ] Verify build:

```bash
ng build --configuration development 2>&1 | tail -5
```

Expected: `Application bundle generation complete.`

- [ ] Commit:

```bash
git add src/app/pages/legal/privacy/ src/app/app.routes.ts
git commit -m "feat: Privacy Policy page with two-column layout, sticky ToC, scroll animations"
```

---

## Task 8: Footer legal links

**Files:**
- Modify: `src/app/app.component.html`

- [ ] In `src/app/app.component.html`, find the footer `<nav class="bb-footer__links">` and add Terms and Privacy links:

```html
<nav class="bb-footer__links" aria-label="Footer navigation">
  <a routerLink="/main">Home</a>
  <a routerLink="/menu">Menu</a>
  <a routerLink="/cart">Cart</a>
  <a routerLink="/profile/orders">Orders</a>
  <a routerLink="/terms">Terms</a>
  <a routerLink="/privacy">Privacy</a>
</nav>
```

- [ ] Commit:

```bash
git add src/app/app.component.html
git commit -m "feat: add Terms and Privacy Policy links to footer"
```

---

## Task 9: Production build verification

- [ ] Run the full production build:

```bash
ng build --configuration production 2>&1 | tail -15
```

Expected: `Application bundle generation complete.` with zero errors.

- [ ] Check `dist/belly-bee/browser/` contains legal page chunks:

```bash
ls dist/belly-bee/browser/ | grep -i chunk
```

Expected: Several chunks including entries for `terms-component` and `privacy-component`.

- [ ] Run the test suite:

```bash
ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -5
```

Expected: `TOTAL: 4 SUCCESS`

- [ ] If build passes with no errors, commit the final verification:

```bash
git add -A
git commit -m "fix: production build verification — all pages compile cleanly"
```

---

## Self-Review Checklist

- [x] **Spec Section 1** (guest auth): Task 2 adds `canActivate` to checkout + auth-aware `checkout()` method in CartComponent
- [x] **Spec Section 2** (login redesign): Tasks 3–5 cover TS/HTML/CSS in full; motion animations in Task 3 `ngAfterViewInit`
- [x] **Spec Section 3** (T&C): Task 6 — full content, two-column layout, `inView()` animations, route added
- [x] **Spec Section 4** (Privacy): Task 7 — full content, identical layout, route added
- [x] **Spec Section 5** (motion): Installed in Task 1; `animate/stagger/spring` in Task 3; `inView/animate` in Tasks 6–7
- [x] **Spec Section 6** (routes): `/terms` in Task 6, `/privacy` in Task 7, checkout guard in Task 2, login links in Task 4 HTML
- [x] **Spec Section 6** (footer): Task 8
- [x] **Cart persistence note**: No code change needed — localStorage survives login by design; documented in spec
- [x] **`phoneFocused`**: Declared as plain boolean in Task 3 TS, bound via `[class.focused]` and `(focus)/(blur)` in Task 4 HTML ✅
- [x] **`onLogoError`**: Defined in Task 3 TS, called in Task 4 HTML ✅
- [x] **`canSubmit` uses `termsAccepted()`**: Task 3 — `computed(() => phone().length === 10 && termsAccepted() && !sending())` ✅
- [x] **No placeholders**: All code blocks are complete and self-contained ✅
